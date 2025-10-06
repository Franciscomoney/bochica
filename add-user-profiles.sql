-- Create user_profiles table for storing user information
CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_address TEXT PRIMARY KEY,
  name TEXT,
  bio TEXT,
  links TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON user_profiles(wallet_address);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores user profile information linked to wallet addresses';
COMMENT ON COLUMN user_profiles.wallet_address IS 'Primary key - Polkadot wallet address';
COMMENT ON COLUMN user_profiles.name IS 'User display name';
COMMENT ON COLUMN user_profiles.bio IS 'User bio/description';
COMMENT ON COLUMN user_profiles.links IS 'Array of social media/website links';
