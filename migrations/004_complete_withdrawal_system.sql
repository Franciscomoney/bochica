-- =====================================================
-- BOCHICA COMPLETE WITHDRAWAL SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create project_balances table (if not exists)
CREATE TABLE IF NOT EXISTS project_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  available_balance DECIMAL(15, 2) DEFAULT 0,
  withdrawn_balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_balances_project ON project_balances(project_id);

ALTER TABLE project_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for project_balances" ON project_balances;
CREATE POLICY "Public read access for project_balances" ON project_balances FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create project_balances" ON project_balances;
CREATE POLICY "Users can create project_balances" ON project_balances FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update project_balances" ON project_balances;
CREATE POLICY "Users can update project_balances" ON project_balances FOR UPDATE USING (true);

-- 2. Auto-update project_balances when commitments are made
CREATE OR REPLACE FUNCTION update_project_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_balances (project_id, available_balance)
  VALUES (NEW.project_id, NEW.amount)
  ON CONFLICT (project_id)
  DO UPDATE SET
    available_balance = project_balances.available_balance + NEW.amount,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_balance_on_commitment ON commitments;
CREATE TRIGGER trg_update_balance_on_commitment
AFTER INSERT ON commitments
FOR EACH ROW
EXECUTE FUNCTION update_project_balance();

-- 3. Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  creator_address TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  blockchain_tx TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_project ON withdrawal_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read withdrawal_requests" ON withdrawal_requests;
CREATE POLICY "Public read withdrawal_requests" ON withdrawal_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can create withdrawal_requests" ON withdrawal_requests;
CREATE POLICY "Creators can create withdrawal_requests" ON withdrawal_requests FOR INSERT WITH CHECK (true);

-- 4. Fix loans table to support pending_disbursement status
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'loans_status_check'
    AND table_name = 'loans'
  ) THEN
    ALTER TABLE loans DROP CONSTRAINT loans_status_check;
  END IF;

  -- Add new constraint with all valid statuses
  ALTER TABLE loans ADD CONSTRAINT loans_status_check
    CHECK (status IN ('pending_disbursement', 'active', 'repaying', 'repaid', 'defaulted'));
EXCEPTION
  WHEN OTHERS THEN
    -- If constraint already correct, skip
    NULL;
END $$;

-- 5. Add withdrawal_request_id to loans table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans'
    AND column_name = 'withdrawal_request_id'
  ) THEN
    ALTER TABLE loans ADD COLUMN withdrawal_request_id UUID REFERENCES withdrawal_requests(id);
  END IF;
END $$;

-- 6. Add additional loan fields if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans'
    AND column_name = 'interest_amount'
  ) THEN
    ALTER TABLE loans ADD COLUMN interest_amount DECIMAL(15, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans'
    AND column_name = 'total_repayment'
  ) THEN
    ALTER TABLE loans ADD COLUMN total_repayment DECIMAL(15, 2);
  END IF;
END $$;

-- 7. Create function to auto-update project status to 'funded'
CREATE OR REPLACE FUNCTION auto_update_project_status()
RETURNS TRIGGER AS $$
DECLARE
  project_goal DECIMAL(15, 2);
  project_current DECIMAL(15, 2);
BEGIN
  -- Get project details
  SELECT goal_amount, current_funding INTO project_goal, project_current
  FROM projects WHERE id = NEW.project_id;

  -- If project just became fully funded, update status
  IF project_current >= project_goal THEN
    UPDATE projects
    SET status = 'funded'
    WHERE id = NEW.project_id
      AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_update_status ON commitments;
CREATE TRIGGER trg_auto_update_status
AFTER INSERT ON commitments
FOR EACH ROW
EXECUTE FUNCTION auto_update_project_status();

-- =====================================================
-- VERIFICATION QUERIES (run these to confirm success)
-- =====================================================

-- Check project_balances table exists
SELECT COUNT(*) as project_balances_count FROM project_balances;

-- Check withdrawal_requests table exists
SELECT COUNT(*) as withdrawal_requests_count FROM withdrawal_requests;

-- Check loans constraint is fixed
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'loans_status_check';

-- Check triggers are active
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trg_update_balance_on_commitment', 'trg_auto_update_status');

-- Success message
SELECT 'Migration completed successfully!' as status;
