-- ============================================================
-- PRO DIGITALIX — Schéma Complet PostgreSQL
-- Version 1.0.0
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. UTILISATEURS & AUTHENTIFICATION
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name     VARCHAR(255),
  avatar_url    TEXT,
  role          VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  plan          VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  is_active     BOOLEAN DEFAULT true,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE oauth_accounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'facebook')),
  provider_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. COMPTES CHARIOW
-- ============================================================

CREATE TABLE chariow_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  store_name      VARCHAR(255),
  store_slug      VARCHAR(255),
  api_key         TEXT,
  api_key_encrypted TEXT,
  store_url       TEXT,
  currency        VARCHAR(10) DEFAULT 'XOF',
  is_active       BOOLEAN DEFAULT true,
  last_sync_at    TIMESTAMPTZ,
  sync_status     VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,
  status          VARCHAR(20) CHECK (status IN ('running', 'success', 'error')),
  records_synced  INTEGER DEFAULT 0,
  error_message   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  finished_at     TIMESTAMPTZ
);

-- ============================================================
-- 3. PRODUITS
-- ============================================================

CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id        UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  chariow_id        VARCHAR(255),
  name              VARCHAR(500) NOT NULL,
  slug              VARCHAR(500),
  description       TEXT,
  price             DECIMAL(12,2) DEFAULT 0,
  currency          VARCHAR(10) DEFAULT 'XOF',
  category          VARCHAR(100),
  type              VARCHAR(50),
  status            VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  thumbnail_url     TEXT,
  total_views       INTEGER DEFAULT 0,
  total_sales       INTEGER DEFAULT 0,
  total_revenue     DECIMAL(12,2) DEFAULT 0,
  conversion_rate   DECIMAL(5,2) DEFAULT 0,
  ai_score          DECIMAL(3,1),
  ai_category       VARCHAR(20) CHECK (ai_category IN ('top', 'weak', 'potential', 'declining')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, chariow_id)
);

-- ============================================================
-- 4. CLIENTS (CRM)
-- ============================================================

CREATE TABLE customers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id        UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  chariow_id        VARCHAR(255),
  first_name        VARCHAR(255),
  last_name         VARCHAR(255),
  email             VARCHAR(255),
  phone             VARCHAR(50),
  whatsapp          VARCHAR(50),
  country           VARCHAR(100),
  city              VARCHAR(100),
  total_orders      INTEGER DEFAULT 0,
  total_spent       DECIMAL(12,2) DEFAULT 0,
  average_order     DECIMAL(12,2) DEFAULT 0,
  first_order_at    TIMESTAMPTZ,
  last_order_at     TIMESTAMPTZ,
  customer_segment  VARCHAR(20) CHECK (customer_segment IN ('new', 'returning', 'loyal', 'vip', 'at_risk', 'lost')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, chariow_id)
);

-- ============================================================
-- 5. VENTES & COMMANDES
-- ============================================================

CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  chariow_id      VARCHAR(255),
  customer_id     UUID REFERENCES customers(id),
  order_number    VARCHAR(100),
  status          VARCHAR(30) CHECK (status IN ('pending', 'paid', 'completed', 'refunded', 'cancelled')),
  subtotal        DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total           DECIMAL(12,2) DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'XOF',
  payment_method  VARCHAR(50),
  source          VARCHAR(50),
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, chariow_id)
);

CREATE TABLE sale_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id     UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  product_name VARCHAR(500),
  quantity    INTEGER DEFAULT 1,
  unit_price  DECIMAL(12,2),
  total_price DECIMAL(12,2)
);

-- ============================================================
-- 6. VISITEURS & ANALYTICS
-- ============================================================

CREATE TABLE visitor_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  session_id      VARCHAR(255) NOT NULL,
  visitor_id      VARCHAR(255),
  ip_address      INET,
  country         VARCHAR(100),
  city            VARCHAR(100),
  device_type     VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser         VARCHAR(100),
  os              VARCHAR(100),
  source          VARCHAR(50) CHECK (source IN ('facebook', 'tiktok', 'whatsapp', 'instagram', 'google', 'direct', 'other')),
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  landing_page    TEXT,
  pages_viewed    INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 0,
  bounced         BOOLEAN DEFAULT false,
  converted       BOOLEAN DEFAULT false,
  visited_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_views (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id  UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  session_id  VARCHAR(255),
  page_url    TEXT,
  page_title  TEXT,
  product_id  UUID REFERENCES products(id),
  time_spent  INTEGER DEFAULT 0,
  viewed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE click_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id  UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  session_id  VARCHAR(255),
  element     VARCHAR(255),
  page_url    TEXT,
  product_id  UUID REFERENCES products(id),
  clicked_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PANIERS ABANDONNÉS
-- ============================================================

CREATE TABLE abandoned_carts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  session_id      VARCHAR(255),
  customer_email  VARCHAR(255),
  customer_phone  VARCHAR(50),
  total_value     DECIMAL(12,2) DEFAULT 0,
  items_count     INTEGER DEFAULT 0,
  recovery_sent   BOOLEAN DEFAULT false,
  recovered       BOOLEAN DEFAULT false,
  abandoned_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE abandoned_cart_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id         UUID REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id),
  product_name    VARCHAR(500),
  quantity        INTEGER DEFAULT 1,
  unit_price      DECIMAL(12,2)
);

-- ============================================================
-- 8. MÉTRIQUES QUOTIDIENNES (Snapshots pour performances)
-- ============================================================

CREATE TABLE daily_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  total_visitors  INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_sessions  INTEGER DEFAULT 0,
  total_orders    INTEGER DEFAULT 0,
  total_revenue   DECIMAL(12,2) DEFAULT 0,
  avg_order_value DECIMAL(12,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  bounce_rate     DECIMAL(5,2) DEFAULT 0,
  new_customers   INTEGER DEFAULT 0,
  abandoned_carts INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date)
);

CREATE TABLE product_daily_metrics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  account_id    UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  views         INTEGER DEFAULT 0,
  sales         INTEGER DEFAULT 0,
  revenue       DECIMAL(12,2) DEFAULT 0,
  conversion    DECIMAL(5,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- ============================================================
-- 9. INTELLIGENCE ARTIFICIELLE
-- ============================================================

CREATE TABLE ai_insights (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id),
  type            VARCHAR(50) CHECK (type IN ('recommendation', 'alert', 'forecast', 'tip')),
  category        VARCHAR(50),
  title           VARCHAR(500),
  content         TEXT,
  priority        VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read         BOOLEAN DEFAULT false,
  is_dismissed    BOOLEAN DEFAULT false,
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_forecasts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  period          VARCHAR(20) CHECK (period IN ('week', 'month', 'quarter')),
  metric          VARCHAR(50),
  predicted_value DECIMAL(12,2),
  confidence      DECIMAL(5,2),
  actual_value    DECIMAL(12,2),
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  period_start    DATE,
  period_end      DATE
);

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id  UUID REFERENCES chariow_accounts(id),
  type        VARCHAR(50) CHECK (type IN ('new_sale', 'abandoned_cart', 'new_customer', 'goal_reached', 'ai_alert', 'sync_error')),
  title       VARCHAR(255),
  body        TEXT,
  data        JSONB,
  is_read     BOOLEAN DEFAULT false,
  sent_push   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  new_sale        BOOLEAN DEFAULT true,
  abandoned_cart  BOOLEAN DEFAULT true,
  new_customer    BOOLEAN DEFAULT true,
  goal_reached    BOOLEAN DEFAULT true,
  ai_alerts       BOOLEAN DEFAULT true,
  email_enabled   BOOLEAN DEFAULT true,
  push_enabled    BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- ============================================================
-- 11. OBJECTIFS & GOALS
-- ============================================================

CREATE TABLE goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id    UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  title         VARCHAR(255),
  metric        VARCHAR(50) CHECK (metric IN ('revenue', 'orders', 'customers', 'conversion')),
  target_value  DECIMAL(12,2),
  current_value DECIMAL(12,2) DEFAULT 0,
  period        VARCHAR(20) CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date    DATE,
  end_date      DATE,
  is_reached    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. ABONNEMENTS & PLANS
-- ============================================================

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  plan            VARCHAR(20) CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  status          VARCHAR(20) CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  price           DECIMAL(12,2),
  currency        VARCHAR(10) DEFAULT 'XOF',
  billing_cycle   VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  payment_ref     VARCHAR(255)
);

CREATE TABLE plan_limits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan                VARCHAR(20) UNIQUE CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  max_accounts        INTEGER DEFAULT 1,
  max_products        INTEGER DEFAULT 10,
  max_customers       INTEGER DEFAULT 100,
  data_retention_days INTEGER DEFAULT 30,
  ai_insights         BOOLEAN DEFAULT false,
  export_reports      BOOLEAN DEFAULT false,
  api_access          BOOLEAN DEFAULT false,
  custom_domain       BOOLEAN DEFAULT false
);

-- ============================================================
-- 13. PIXEL PRO DIGITALIX (Fallback tracking)
-- ============================================================

CREATE TABLE pixel_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id  UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  pixel_id    VARCHAR(255) NOT NULL,
  event_type  VARCHAR(50) CHECK (event_type IN ('pageview', 'click', 'add_to_cart', 'purchase', 'abandon')),
  session_id  VARCHAR(255),
  visitor_id  VARCHAR(255),
  page_url    TEXT,
  product_id  VARCHAR(255),
  value       DECIMAL(12,2),
  currency    VARCHAR(10),
  metadata    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. RAPPORTS
-- ============================================================

CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id  UUID REFERENCES chariow_accounts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(20) CHECK (type IN ('daily', 'weekly', 'monthly', 'annual', 'custom')),
  format      VARCHAR(10) CHECK (format IN ('pdf', 'excel', 'csv')),
  status      VARCHAR(20) CHECK (status IN ('pending', 'generating', 'ready', 'error')),
  file_url    TEXT,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  ready_at    TIMESTAMPTZ
);

-- ============================================================
-- INDEX PERFORMANCE
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Chariow Accounts
CREATE INDEX idx_chariow_accounts_user ON chariow_accounts(user_id);
CREATE INDEX idx_chariow_accounts_slug ON chariow_accounts(store_slug);

-- Sales
CREATE INDEX idx_sales_account ON sales(account_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_customer ON sales(customer_id);

-- Customers
CREATE INDEX idx_customers_account ON customers(account_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_segment ON customers(customer_segment);

-- Products
CREATE INDEX idx_products_account ON products(account_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_ai_category ON products(ai_category);

-- Visitors
CREATE INDEX idx_visitor_sessions_account ON visitor_sessions(account_id);
CREATE INDEX idx_visitor_sessions_visited ON visitor_sessions(visited_at DESC);
CREATE INDEX idx_visitor_sessions_source ON visitor_sessions(source);

-- Daily Metrics
CREATE INDEX idx_daily_metrics_account_date ON daily_metrics(account_id, date DESC);
CREATE INDEX idx_product_daily_metrics_date ON product_daily_metrics(product_id, date DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Pixel Events
CREATE INDEX idx_pixel_events_account ON pixel_events(account_id);
CREATE INDEX idx_pixel_events_type ON pixel_events(event_type);
CREATE INDEX idx_pixel_events_created ON pixel_events(created_at DESC);

-- AI Insights
CREATE INDEX idx_ai_insights_account ON ai_insights(account_id, is_dismissed);

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Plans par défaut
INSERT INTO plan_limits (plan, max_accounts, max_products, max_customers, data_retention_days, ai_insights, export_reports, api_access, custom_domain) VALUES
  ('free',       1,   10,    100,   30,  false, false, false, false),
  ('starter',    2,   50,    1000,  90,  false, true,  false, false),
  ('pro',        5,   500,   10000, 365, true,  true,  true,  false),
  ('enterprise', 20,  99999, 99999, 730, true,  true,  true,  true);

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_chariow_accounts_updated_at BEFORE UPDATE ON chariow_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
