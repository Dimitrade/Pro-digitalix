-- Notifications centre
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

-- Tokens FCM par device
CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id  UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  fcm_token   TEXT NOT NULL,
  platform    VARCHAR(20) DEFAULT 'web',  -- web | android | ios
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

-- Préférences notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email            BOOLEAN DEFAULT true,
  push             BOOLEAN DEFAULT true,
  sms              BOOLEAN DEFAULT false,
  whatsapp         BOOLEAN DEFAULT false,
  new_sale         BOOLEAN DEFAULT true,
  new_customer     BOOLEAN DEFAULT true,
  cart_abandon     BOOLEAN DEFAULT true,
  goal_reached     BOOLEAN DEFAULT true,
  trending_product BOOLEAN DEFAULT true,
  weak_product     BOOLEAN DEFAULT true,
  ai_recommendation BOOLEAN DEFAULT true,
  silence_start    TIME DEFAULT '22:00',
  silence_end      TIME DEFAULT '07:00',
  prefs            JSONB DEFAULT '{}',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
