-- Bochica Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount DECIMAL(15, 2) NOT NULL,
  current_funding DECIMAL(15, 2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'funded', 'borrowing', 'repaying', 'completed', 'cancelled')),
  creator_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Commitments table (investor commitments to projects)
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  investor_address TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  lockup_period TEXT NOT NULL CHECK (lockup_period IN ('24h', '72h', '7d')),
  unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('locked', 'unlocked', 'redeemed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loans table (borrowed funds from committed pool)
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  borrower_address TEXT NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_amount DECIMAL(15, 2) NOT NULL,
  total_repayment DECIMAL(15, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'repaid', 'defaulted')),
  borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  repaid_at TIMESTAMP WITH TIME ZONE
);

-- Transactions table (all financial movements)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_type TEXT NOT NULL CHECK (tx_type IN ('commitment', 'redemption', 'borrow', 'repayment', 'platform_fee', 'interest_payment')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_address TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  platform_fee DECIMAL(15, 2) DEFAULT 0,
  blockchain_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User balances table (track user balances on each chain)
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  chain TEXT NOT NULL CHECK (chain IN ('asset_hub', 'moonbeam')),
  balance DECIMAL(15, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_address, chain)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_address);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_commitments_project ON commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_commitments_investor ON commitments(investor_address);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_loans_project ON loans(project_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_address);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_user_balances_address ON user_balances(user_address);

-- Row Level Security (RLS) Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read access for projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read access for commitments" ON commitments FOR SELECT USING (true);
CREATE POLICY "Public read access for loans" ON loans FOR SELECT USING (true);
CREATE POLICY "Public read access for transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public read access for user_balances" ON user_balances FOR SELECT USING (true);

-- Allow users to insert their own records
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can create commitments" ON commitments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can create loans" ON loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can create balances" ON user_balances FOR INSERT WITH CHECK (true);

-- Allow users to update their own records
CREATE POLICY "Users can update their projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Users can update their commitments" ON commitments FOR UPDATE USING (true);
CREATE POLICY "Users can update their loans" ON loans FOR UPDATE USING (true);
CREATE POLICY "Users can update transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Users can update their balances" ON user_balances FOR UPDATE USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
