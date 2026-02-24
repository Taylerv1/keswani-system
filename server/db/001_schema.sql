-- ============================================================
-- Keswani System — Production PostgreSQL Schema for Supabase
-- Version: 1.0.0
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. REUSABLE TRIGGER FUNCTION — auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. ENUM TYPES
-- ============================================================
CREATE TYPE employee_role AS ENUM ('owner', 'admin', 'employee');
CREATE TYPE contract_status AS ENUM ('pending', 'active', 'expired', 'terminated');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'other');
CREATE TYPE maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE notification_channel AS ENUM ('email', 'whatsapp', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE expense_category AS ENUM ('maintenance', 'purchase', 'utility', 'salary', 'other');
CREATE TYPE meter_type AS ENUM ('residential', 'commercial');
CREATE TYPE reading_source AS ENUM ('manual', 'automatic');
CREATE TYPE property_type AS ENUM ('building', 'house', 'land', 'commercial');

-- ============================================================
-- 4. SHARED / AUTH TABLES
-- ============================================================

-- -----------------------------------------------
-- 4a. employees (owner + admin + employee unified)
-- -----------------------------------------------
CREATE TABLE employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID UNIQUE,                                -- links to auth.users
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT,
  address       TEXT,
  role          employee_role NOT NULL DEFAULT 'employee',
  access        JSONB NOT NULL DEFAULT '{}'::jsonb,          -- fine-grained permissions
  is_active     BOOLEAN NOT NULL DEFAULT true,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 4b. clients (tenants / electricity subscribers)
-- -----------------------------------------------
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID UNIQUE,                                -- links to auth.users for client portal
  full_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  notes         TEXT,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. RENT SYSTEM
-- ============================================================

-- -----------------------------------------------
-- 5a. properties (buildings / compounds)
-- -----------------------------------------------
CREATE TABLE properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  type          property_type NOT NULL DEFAULT 'building',
  managed_by    UUID REFERENCES employees(id) ON DELETE RESTRICT,
  owner_notes   TEXT,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 5b. units (apartments / shops within a property)
-- -----------------------------------------------
CREATE TABLE units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  unit_number   TEXT NOT NULL,
  floor         INT,
  bedrooms      INT,
  bathrooms     INT,
  area_sqm      NUMERIC(10, 2),
  description   TEXT,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_property_unit UNIQUE (property_id, unit_number)
);

-- -----------------------------------------------
-- 5c. contracts (lease agreements)
-- -----------------------------------------------
CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  monthly_rent    NUMERIC(12, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  deposit_amount  NUMERIC(12, 2) DEFAULT 0,
  status          contract_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_contract_rent_positive CHECK (monthly_rent > 0),
  CONSTRAINT chk_contract_deposit_non_negative CHECK (deposit_amount >= 0),
  CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- -----------------------------------------------
-- 5d. rent_payments
-- -----------------------------------------------
CREATE TABLE rent_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  amount          NUMERIC(12, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  payment_date    DATE NOT NULL,
  period_start    DATE,
  period_end      DATE,
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  status          payment_status NOT NULL DEFAULT 'pending',
  received_by     UUID REFERENCES employees(id) ON DELETE RESTRICT,
  receipt_number  TEXT,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_rent_payment_positive CHECK (amount > 0),
  CONSTRAINT chk_rent_period CHECK (period_end IS NULL OR period_end >= period_start)
);

-- -----------------------------------------------
-- 5e. maintenance_requests
-- -----------------------------------------------
CREATE TABLE maintenance_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  requested_by    UUID REFERENCES clients(id) ON DELETE RESTRICT,
  assigned_to     UUID REFERENCES employees(id) ON DELETE RESTRICT,
  title           TEXT NOT NULL,
  description     TEXT,
  status          maintenance_status NOT NULL DEFAULT 'pending',
  priority        maintenance_priority NOT NULL DEFAULT 'medium',
  estimated_cost  NUMERIC(12, 2),
  actual_cost     NUMERIC(12, 2),
  completed_at    TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_maintenance_est_cost CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  CONSTRAINT chk_maintenance_act_cost CHECK (actual_cost IS NULL OR actual_cost >= 0)
);

-- ============================================================
-- 6. ELECTRICITY SYSTEM
-- ============================================================

-- -----------------------------------------------
-- 6a. subscribers (generator electricity subscribers)
-- -----------------------------------------------
CREATE TABLE subscribers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  subscription_number TEXT NOT NULL UNIQUE,
  property_id         UUID REFERENCES properties(id) ON DELETE RESTRICT,
  unit_id             UUID REFERENCES units(id) ON DELETE RESTRICT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 6b. meters
-- -----------------------------------------------
CREATE TABLE meters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id       UUID NOT NULL REFERENCES subscribers(id) ON DELETE RESTRICT,
  meter_number        TEXT NOT NULL UNIQUE,
  meter_type          meter_type NOT NULL DEFAULT 'residential',
  installation_date   DATE,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  last_reading_value  NUMERIC(12, 2),                     -- cached for quick display
  last_reading_date   DATE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 6c. readings (meter readings — core of billing)
-- -----------------------------------------------
CREATE TABLE readings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id        UUID NOT NULL REFERENCES meters(id) ON DELETE RESTRICT,
  reading_value   NUMERIC(12, 2) NOT NULL,
  reading_date    DATE NOT NULL,
  recorded_by     UUID REFERENCES employees(id) ON DELETE RESTRICT,
  source          reading_source NOT NULL DEFAULT 'manual',
  photo_url       TEXT,                                   -- proof photo
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_reading_value CHECK (reading_value >= 0),
  CONSTRAINT uq_meter_reading_date UNIQUE (meter_id, reading_date)
);

-- -----------------------------------------------
-- 6d. pricing_history (variable KWh rates for Lebanon)
-- -----------------------------------------------
CREATE TABLE pricing_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_per_kwh   NUMERIC(10, 4) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  effective_from  DATE NOT NULL,
  effective_to    DATE,                                   -- NULL = currently active
  set_by          UUID REFERENCES employees(id) ON DELETE RESTRICT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_pricing_positive CHECK (price_per_kwh > 0),
  CONSTRAINT chk_pricing_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- -----------------------------------------------
-- 6e. bills (generated electricity bills)
-- -----------------------------------------------
CREATE TABLE bills (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id              UUID NOT NULL REFERENCES meters(id) ON DELETE RESTRICT,
  subscriber_id         UUID NOT NULL REFERENCES subscribers(id) ON DELETE RESTRICT,
  billing_period_start  DATE NOT NULL,
  billing_period_end    DATE NOT NULL,
  previous_reading      NUMERIC(12, 2) NOT NULL,
  current_reading       NUMERIC(12, 2) NOT NULL,
  consumption_kwh       NUMERIC(12, 2) NOT NULL,          -- current_reading - previous_reading
  price_per_kwh         NUMERIC(10, 4) NOT NULL,          -- snapshot from pricing_history
  total_amount          NUMERIC(14, 2) NOT NULL,           -- consumption_kwh × price_per_kwh
  currency              TEXT NOT NULL DEFAULT 'USD',
  status                payment_status NOT NULL DEFAULT 'pending',
  generated_by          UUID REFERENCES employees(id) ON DELETE RESTRICT,
  notes                 TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_bill_consumption CHECK (consumption_kwh >= 0),
  CONSTRAINT chk_bill_total CHECK (total_amount >= 0),
  CONSTRAINT chk_bill_readings CHECK (current_reading >= previous_reading),
  CONSTRAINT chk_bill_period CHECK (billing_period_end >= billing_period_start)
);

-- -----------------------------------------------
-- 6f. bill_payments
-- -----------------------------------------------
CREATE TABLE bill_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id         UUID NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
  amount          NUMERIC(12, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  payment_date    DATE NOT NULL,
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  status          payment_status NOT NULL DEFAULT 'pending',
  received_by     UUID REFERENCES employees(id) ON DELETE RESTRICT,
  receipt_number  TEXT,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_bill_payment_positive CHECK (amount > 0)
);

-- ============================================================
-- 7. FINANCIAL TRACKING
-- ============================================================

-- -----------------------------------------------
-- 7a. expenses (repairs, purchases, salaries, etc.)
-- -----------------------------------------------
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        expense_category NOT NULL DEFAULT 'other',
  amount          NUMERIC(14, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  description     TEXT NOT NULL,
  expense_date    DATE NOT NULL,
  property_id     UUID REFERENCES properties(id) ON DELETE RESTRICT,
  unit_id         UUID REFERENCES units(id) ON DELETE RESTRICT,
  paid_by         UUID REFERENCES employees(id) ON DELETE RESTRICT,
  receipt_url     TEXT,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_expense_positive CHECK (amount > 0)
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type        TEXT NOT NULL,                     -- 'client' or 'employee'
  recipient_id          UUID NOT NULL,                     -- polymorphic FK
  channel               notification_channel NOT NULL DEFAULT 'in_app',
  subject               TEXT,
  body                  TEXT,
  status                notification_status NOT NULL DEFAULT 'pending',
  scheduled_at          TIMESTAMPTZ,
  sent_at               TIMESTAMPTZ,
  related_entity_type   TEXT,                              -- e.g. 'contract', 'bill'
  related_entity_id     UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_notification_recipient_type CHECK (recipient_type IN ('client', 'employee'))
);

-- ============================================================
-- 9. TRIGGERS — auto-update updated_at on all tables
-- ============================================================

CREATE TRIGGER set_updated_at_employees
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_properties
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_units
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_contracts
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_rent_payments
  BEFORE UPDATE ON rent_payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_maintenance_requests
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_subscribers
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_meters
  BEFORE UPDATE ON meters
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_readings
  BEFORE UPDATE ON readings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_pricing_history
  BEFORE UPDATE ON pricing_history
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_bills
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_bill_payments
  BEFORE UPDATE ON bill_payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_notifications
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 10. INDEXES
-- ============================================================

-- ---------- Soft delete partial indexes (filter deleted rows) ----------
CREATE INDEX idx_employees_active ON employees (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_active ON clients (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_active ON properties (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_units_active ON units (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_active ON contracts (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rent_payments_active ON rent_payments (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_requests_active ON maintenance_requests (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscribers_active ON subscribers (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_meters_active ON meters (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bills_active ON bills (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bill_payments_active ON bill_payments (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_active ON expenses (id) WHERE deleted_at IS NULL;

-- ---------- Foreign key indexes ----------
CREATE INDEX idx_properties_managed_by ON properties (managed_by);
CREATE INDEX idx_units_property_id ON units (property_id);
CREATE INDEX idx_contracts_unit_id ON contracts (unit_id);
CREATE INDEX idx_contracts_client_id ON contracts (client_id);
CREATE INDEX idx_rent_payments_contract_id ON rent_payments (contract_id);
CREATE INDEX idx_rent_payments_received_by ON rent_payments (received_by);
CREATE INDEX idx_maintenance_unit_id ON maintenance_requests (unit_id);
CREATE INDEX idx_maintenance_requested_by ON maintenance_requests (requested_by);
CREATE INDEX idx_maintenance_assigned_to ON maintenance_requests (assigned_to);
CREATE INDEX idx_subscribers_client_id ON subscribers (client_id);
CREATE INDEX idx_subscribers_property_id ON subscribers (property_id);
CREATE INDEX idx_subscribers_unit_id ON subscribers (unit_id);
CREATE INDEX idx_meters_subscriber_id ON meters (subscriber_id);
CREATE INDEX idx_readings_meter_id ON readings (meter_id);
CREATE INDEX idx_readings_recorded_by ON readings (recorded_by);
CREATE INDEX idx_bills_meter_id ON bills (meter_id);
CREATE INDEX idx_bills_subscriber_id ON bills (subscriber_id);
CREATE INDEX idx_bills_generated_by ON bills (generated_by);
CREATE INDEX idx_bill_payments_bill_id ON bill_payments (bill_id);
CREATE INDEX idx_bill_payments_received_by ON bill_payments (received_by);
CREATE INDEX idx_expenses_property_id ON expenses (property_id);
CREATE INDEX idx_expenses_unit_id ON expenses (unit_id);
CREATE INDEX idx_expenses_paid_by ON expenses (paid_by);

-- ---------- Business query indexes ----------
CREATE INDEX idx_employees_role ON employees (role) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_auth_user ON employees (auth_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_auth_user ON clients (auth_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON contracts (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_dates ON contracts (start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_rent_payments_date ON rent_payments (payment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_rent_payments_status ON rent_payments (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_status ON maintenance_requests (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscribers_active_flag ON subscribers (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_meters_active_flag ON meters (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_readings_date ON readings (reading_date);
CREATE INDEX idx_readings_meter_date ON readings (meter_id, reading_date DESC);
CREATE INDEX idx_pricing_effective ON pricing_history (effective_from, effective_to);
CREATE INDEX idx_bills_period ON bills (billing_period_start, billing_period_end) WHERE deleted_at IS NULL;
CREATE INDEX idx_bills_status ON bills (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bill_payments_date ON bill_payments (payment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_date ON expenses (expense_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_category ON expenses (category) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_recipient ON notifications (recipient_type, recipient_id);
CREATE INDEX idx_notifications_status ON notifications (status);
CREATE INDEX idx_notifications_scheduled ON notifications (scheduled_at) WHERE status = 'pending';

-- ============================================================
-- 11. ROW LEVEL SECURITY — Enable on all tables (policies TBD)
-- ============================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. HELPER VIEWS — Profit & Loss computation
-- ============================================================

-- View: Monthly rent income summary
CREATE OR REPLACE VIEW v_rent_income_summary AS
SELECT
  date_trunc('month', rp.payment_date) AS month,
  rp.currency,
  SUM(rp.amount) AS total_rent_income,
  COUNT(*) AS payment_count
FROM rent_payments rp
WHERE rp.deleted_at IS NULL
  AND rp.status = 'paid'
GROUP BY date_trunc('month', rp.payment_date), rp.currency;

-- View: Monthly electricity income summary
CREATE OR REPLACE VIEW v_electricity_income_summary AS
SELECT
  date_trunc('month', bp.payment_date) AS month,
  bp.currency,
  SUM(bp.amount) AS total_electricity_income,
  COUNT(*) AS payment_count
FROM bill_payments bp
WHERE bp.deleted_at IS NULL
  AND bp.status = 'paid'
GROUP BY date_trunc('month', bp.payment_date), bp.currency;

-- View: Monthly expenses summary
CREATE OR REPLACE VIEW v_expenses_summary AS
SELECT
  date_trunc('month', e.expense_date) AS month,
  e.currency,
  e.category,
  SUM(e.amount) AS total_expenses,
  COUNT(*) AS expense_count
FROM expenses e
WHERE e.deleted_at IS NULL
GROUP BY date_trunc('month', e.expense_date), e.currency, e.category;

-- View: Outstanding electricity debts (unpaid or partial bills)
CREATE OR REPLACE VIEW v_outstanding_electricity AS
SELECT
  b.id AS bill_id,
  b.subscriber_id,
  s.client_id,
  c.full_name AS client_name,
  b.total_amount,
  b.currency,
  COALESCE(SUM(bp.amount) FILTER (WHERE bp.status = 'paid' AND bp.deleted_at IS NULL), 0) AS paid_amount,
  b.total_amount - COALESCE(SUM(bp.amount) FILTER (WHERE bp.status = 'paid' AND bp.deleted_at IS NULL), 0) AS outstanding_amount,
  b.billing_period_start,
  b.billing_period_end,
  b.status
FROM bills b
JOIN subscribers s ON s.id = b.subscriber_id
JOIN clients c ON c.id = s.client_id
LEFT JOIN bill_payments bp ON bp.bill_id = b.id
WHERE b.deleted_at IS NULL
  AND b.status IN ('pending', 'partial', 'overdue')
GROUP BY b.id, b.subscriber_id, s.client_id, c.full_name,
         b.total_amount, b.currency, b.billing_period_start,
         b.billing_period_end, b.status;

-- View: Outstanding rent debts
CREATE OR REPLACE VIEW v_outstanding_rent AS
SELECT
  ct.id AS contract_id,
  ct.client_id,
  cl.full_name AS client_name,
  ct.monthly_rent,
  ct.currency,
  u.unit_number,
  p.name AS property_name,
  ct.start_date,
  ct.end_date,
  COALESCE(SUM(rp.amount) FILTER (WHERE rp.status = 'paid' AND rp.deleted_at IS NULL), 0) AS total_paid,
  ct.status AS contract_status
FROM contracts ct
JOIN clients cl ON cl.id = ct.client_id
JOIN units u ON u.id = ct.unit_id
JOIN properties p ON p.id = u.property_id
LEFT JOIN rent_payments rp ON rp.contract_id = ct.id
WHERE ct.deleted_at IS NULL
  AND ct.status = 'active'
GROUP BY ct.id, ct.client_id, cl.full_name, ct.monthly_rent,
         ct.currency, u.unit_number, p.name, ct.start_date,
         ct.end_date, ct.status;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
