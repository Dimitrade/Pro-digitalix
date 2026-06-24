-- ═══════════════════════════════════════════════════════════════════
-- PRO DIGITALIX — Setup Supabase/PostgreSQL Production
-- Exécuter une seule fois dans l'éditeur SQL Supabase
-- ANABOK GROUP
-- ═══════════════════════════════════════════════════════════════════

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ── Table utilisateurs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255),
  full_name        VARCHAR(255) NOT NULL DEFAULT '',
  avatar_url       TEXT,
  phone            VARCHAR(30),
  country          VARCHAR(60),
  role             VARCHAR(20) DEFAULT 'user',  -- user | admin | owner
  plan             VARCHAR(20) DEFAULT 'free',
  premium          BOOLEAN DEFAULT false,
  premium_at       TIMESTAMPTZ,
  premium_ends     TIMESTAMPTZ,
  subscription_source VARCHAR(30) DEFAULT 'chariow',
  is_active        BOOLEAN DEFAULT true,
  is_verified      BOOLEAN DEFAULT false,
  suspended_at     TIMESTAMPTZ,
  login_count      INTEGER DEFAULT 0,
  last_active_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role    ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(premium, premium_ends);

-- ── OAuth accounts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  provider     VARCHAR(30) NOT NULL,
  provider_id  VARCHAR(255) NOT NULL,
  access_token TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- ── Email verification tokens ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Password reset tokens ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chariow accounts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chariow_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  store_id      VARCHAR(255) NOT NULL,
  store_name    VARCHAR(255),
  api_key       TEXT NOT NULL,
  status        VARCHAR(20) DEFAULT 'active',
  last_sync_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chariow_user ON chariow_accounts(user_id);

-- ── Analytics / Sales / Customers / Products (caches) ────────────────────────
CREATE TABLE IF NOT EXISTS analytics_cache (
  id           BIGSERIAL PRIMARY KEY,
  account_id   UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  cache_key    VARCHAR(255) NOT NULL,
  data         JSONB NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, cache_key)
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           BIGSERIAL PRIMARY KEY,
  account_id   UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  type         VARCHAR(50) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT NOT NULL,
  data         JSONB DEFAULT '{}',
  read_at      TIMESTAMPTZ,
  archived_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_account ON notifications(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(account_id) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id  UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  fcm_token   TEXT NOT NULL,
  platform    VARCHAR(20) DEFAULT 'web',
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email             BOOLEAN DEFAULT true,
  push              BOOLEAN DEFAULT true,
  sms               BOOLEAN DEFAULT false,
  whatsapp          BOOLEAN DEFAULT false,
  new_sale          BOOLEAN DEFAULT true,
  new_customer      BOOLEAN DEFAULT true,
  cart_abandon      BOOLEAN DEFAULT true,
  goal_reached      BOOLEAN DEFAULT true,
  trending_product  BOOLEAN DEFAULT true,
  weak_product      BOOLEAN DEFAULT true,
  ai_recommendation BOOLEAN DEFAULT true,
  silence_start     TIME DEFAULT '22:00',
  silence_end       TIME DEFAULT '07:00',
  prefs             JSONB DEFAULT '{}',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Paiements ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  provider        VARCHAR(50) NOT NULL DEFAULT 'chariow',
  transaction_id  VARCHAR(255) UNIQUE,
  amount          INTEGER NOT NULL,
  currency        VARCHAR(10) DEFAULT 'XOF',
  status          VARCHAR(30) DEFAULT 'pending',
  plan            VARCHAR(30) DEFAULT 'premium',
  duration_months INTEGER DEFAULT 12,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_txid   ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ── Audit logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  target_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  target_email    VARCHAR(255),
  actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email     VARCHAR(255),
  action          VARCHAR(80) NOT NULL,
  details         JSONB DEFAULT '{}',
  ip_address      VARCHAR(45),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON audit_logs(target_user_id);

-- ── Codes promo ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(50) UNIQUE NOT NULL,
  type        VARCHAR(30) NOT NULL,
  value       INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  max_uses    INTEGER,
  used_count  INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  expires_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_uses (
  id        BIGSERIAL PRIMARY KEY,
  promo_id  BIGINT REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  used_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_id, user_id)
);

-- ── Pixel tracking ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pixel_events (
  id         BIGSERIAL PRIMARY KEY,
  account_id UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  page_url   TEXT,
  referrer   TEXT,
  ip_hash    VARCHAR(64),
  user_agent TEXT,
  country    VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pixel_account ON pixel_events(account_id, created_at DESC);

-- ── Trigger updated_at ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed OWNER permanent ──────────────────────────────────────────────────────
-- IMPORTANT : Changer le mot de passe via l'API après insertion
INSERT INTO users (
  id, email, full_name, phone, role, premium,
  premium_at, premium_ends, is_verified, is_active, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'anabokgroup@gmail.com',
  'ANABOK GROUP',
  '+22879812999',
  'owner',
  true,
  NOW(),
  '9999-12-31 23:59:59+00',
  true,
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role         = 'owner',
  premium      = true,
  premium_ends = '9999-12-31 23:59:59+00';

-- ── Row Level Security (Supabase) ─────────────────────────────────────────────
-- Désactiver RLS — l'API gère les permissions via middleware
ALTER TABLE users                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE chariow_accounts        DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments                DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              DISABLE ROW LEVEL SECURITY;

SELECT 'Setup PRO DIGITALIX terminé ✅' AS status;
