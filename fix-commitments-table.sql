-- Add missing columns to commitments table

ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS lockup_expiry TIMESTAMPTZ;

ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS lockup_period VARCHAR(10);

ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS platform_fee_paid DECIMAL(20, 6) DEFAULT 0;

ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(20, 6);

ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS fee_transaction_hash TEXT;

ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS escrow_transaction_hash TEXT;
