-- Track virtual balances for each project (funds held in platform wallet)
CREATE TABLE IF NOT EXISTS project_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  available_balance DECIMAL(15, 2) DEFAULT 0, -- Funds available to withdraw
  withdrawn_balance DECIMAL(15, 2) DEFAULT 0, -- Funds already withdrawn
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_project_balances_project ON project_balances(project_id);

-- Row Level Security
ALTER TABLE project_balances ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for project_balances" ON project_balances FOR SELECT USING (true);

-- Allow inserts and updates
CREATE POLICY "Users can create project_balances" ON project_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update project_balances" ON project_balances FOR UPDATE USING (true);

-- Trigger to update project_balances when commitments are made
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
