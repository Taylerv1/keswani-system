ALTER TABLE "rent_payments"
ADD COLUMN "paid_at" DATE;

-- Backfill: records that are already settled can use current payment_date
-- as a best-effort historical paid date.
UPDATE "rent_payments"
SET "paid_at" = "payment_date"
WHERE "paid_at" IS NULL
  AND "status" IN ('paid', 'partial');
