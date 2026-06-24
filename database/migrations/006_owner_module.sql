-- ── Extensions table users ────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS country          VARCHAR(60),
  ADD COLUMN IF NOT EXISTS login_count      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_source VARCHAR(30) DEFAULT 'chariow',
  -- sources: chariow | owner | promotion | lifetime | test
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN DEFAULT true;

-- ── Journal d'audit ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  target_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  target_email    VARCHAR(255),
  actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email     VARCHAR(255),
  action          VARCHAR(80) NOT NULL,
  -- premium_granted | premium_revoked | premium_extended | lifetime_granted
  -- account_suspended | account_reactivated | payment_received | promo_used
  -- plan_changed | role_changed
  details         JSONB DEFAULT '{}',
  ip_address      VARCHAR(45),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target   ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit_logs(actor_id);

-- ── Codes promotionnels ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(50) UNIQUE NOT NULL,
  type            VARCHAR(30) NOT NULL,
  -- percent_off | amount_off | premium_days | premium_lifetime
  value           INTEGER NOT NULL DEFAULT 0,
  -- pour percent_off: 0-100, amount_off: FCFA, premium_days: jours
  description     TEXT,
  max_uses        INTEGER,          -- NULL = illimité
  used_count      INTEGER DEFAULT 0,
  active          BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_code   ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_active ON promo_codes(active, expires_at);

-- ── Utilisations de codes promo ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_uses (
  id            BIGSERIAL PRIMARY KEY,
  promo_id      BIGINT REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  used_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_id, user_id)
);
