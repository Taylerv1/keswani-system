-- ============================================================
-- Keswani System - Incremental Patch
-- Add employees.salary_amount as a real column
-- ============================================================

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS salary_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_employee_salary_non_negative'
      AND conrelid = 'employees'::regclass
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT chk_employee_salary_non_negative CHECK (salary_amount >= 0);
  END IF;
END $$;

-- Backfill from legacy JSON access.salary_amount if it exists.
UPDATE employees
SET salary_amount = GREATEST(
  COALESCE(NULLIF(access->>'salary_amount', '')::numeric, 0),
  0
)
WHERE access ? 'salary_amount';
