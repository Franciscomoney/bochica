require('dotenv').config({ path: '.env.local' });

module.exports = {
  apps: [{
    name: 'bochica',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      ESCROW_ENCRYPTION_KEY: process.env.ESCROW_ENCRYPTION_KEY,
      PLATFORM_WALLET_ADDRESS: process.env.PLATFORM_WALLET_ADDRESS,
      ESCROW_WALLET_SEED: process.env.ESCROW_WALLET_SEED,
      NEXT_PUBLIC_PROJECT_ESCROW_WALLET: process.env.NEXT_PUBLIC_PROJECT_ESCROW_WALLET,
      NEXT_PUBLIC_PLATFORM_FEE: process.env.NEXT_PUBLIC_PLATFORM_FEE
    }
  }]
};
