-- ── Étendre la table users avec rôle + abonnement ──────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role         VARCHAR(20)  DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS premium      BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_ends TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone        VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_users_role    ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(premium, premium_ends);

-- ── Historique paiements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  provider        VARCHAR(50) NOT NULL DEFAULT 'chariow',
  transaction_id  VARCHAR(255) UNIQUE,
  amount          INTEGER NOT NULL,       -- centimes FCFA
  currency        VARCHAR(10) DEFAULT 'XOF',
  status          VARCHAR(30) DEFAULT 'pending', -- pending | success | failed | refunded
  plan            VARCHAR(30) DEFAULT 'premium',
  duration_months INTEGER DEFAULT 12,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_txid   ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ── Seed OWNER permanent ────────────────────────────────────────────────────
-- Le mot de passe est défini via env OWNER_PASSWORD_HASH ou changé manuellement
INSERT INTO users (
  id, email, full_name, phone, role, premium,
  premium_at, premium_ends, email_verified, created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'anabokgroup@gmail.com',
  'ANABOK GROUP',
  '+22879812999',
  'owner',
  true,
  NOW(),
  '9999-12-31 23:59:59+00',
  true,
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role         = 'owner',
  premium      = true,
  premium_ends = '9999-12-31 23:59:59+00',
  phone        = '+22879812999';
