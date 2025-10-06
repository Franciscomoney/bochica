import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Project {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  creator_address: string;
  goal_amount: number;
  current_funding: number;
  available_funds: number;
  borrowed_funds: number;
  status: 'active' | 'funded' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Commitment {
  id: string;
  project_id: string;
  investor_address: string;
  amount: number;
  platform_fee: number;
  status: 'active' | 'redeemed' | 'locked';
  lockup_period?: '24h' | '72h' | '7d';
  lockup_end_date?: string;
  created_at: string;
  redeemed_at?: string;
}

export interface Loan {
  id: string;
  project_id: string;
  borrower_address: string;
  amount: number;
  interest_rate: number;
  total_repayment: number;
  repaid_amount: number;
  status: 'active' | 'repaid' | 'defaulted';
  borrowed_at: string;
  repaid_at?: string;
  due_date?: string;
}

export interface Transaction {
  id: string;
  tx_type: 'xcm_transfer' | 'commit' | 'redeem' | 'borrow' | 'repay';
  from_address?: string;
  to_address?: string;
  project_id?: string;
  commitment_id?: string;
  loan_id?: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: 'pending' | 'completed' | 'failed';
  blockchain_tx_hash?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface UserBalance {
  wallet_address: string;
  asset_hub_balance: number;
  moonbeam_balance: number;
  total_committed: number;
  total_borrowed: number;
  last_updated: string;
}

// Helper to set current user address for RLS
export const setUserAddress = async (address: string) => {
  await supabase.rpc('set_config', {
    setting: 'app.current_user_address',
    value: address
  });
};
