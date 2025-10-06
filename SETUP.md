# Bochica Platform - Setup Guide

## Overview
Bochica is a micro-lending platform built on Polkadot's parachain architecture, allowing investors to fund projects and borrowers to access capital with transparent, blockchain-backed transactions.

## Prerequisites

1. **Talisman Wallet** - Install from https://talisman.xyz
2. **Supabase Account** - Create at https://supabase.com
3. **Node.js 18+** - Required for Next.js
4. **Polkadot Assets** - USDT on Polkadot Asset Hub

## Step 1: Supabase Setup

### 1.1 Create New Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "bochica" and set a strong password
4. Wait for provisioning (2-3 minutes)

### 1.2 Run Database Setup
1. Go to SQL Editor in Supabase dashboard
2. Create a new query
3. Copy the entire contents of `supabase-setup.sql`
4. Run the query
5. Verify tables are created in Table Editor

### 1.3 Get API Credentials
1. Go to Project Settings → API
2. Copy the following:
   - Project URL
   - anon/public key

## Step 2: Environment Configuration

Create `.env.local` file in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Polkadot Networks
NEXT_PUBLIC_ASSET_HUB_WSS=wss://polkadot-asset-hub-rpc.polkadot.io
NEXT_PUBLIC_MOONBEAM_WSS=wss://wss.api.moonbeam.network

# Platform Settings
NEXT_PUBLIC_PLATFORM_FEE=0.02
NEXT_PUBLIC_LOAN_INTEREST_RATE=0.05
NEXT_PUBLIC_USDT_ASSET_ID=1984
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 5: Configure for Production (Port 8100)

### 5.1 Update package.json
Add custom port script:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:8100": "next dev -p 8100",
    "build": "next build",
    "start": "next start -p 8100"
  }
}
```

### 5.2 Open Firewall
```bash
sudo ufw allow 8100
sudo ufw status
```

### 5.3 Run on Port 8100
```bash
npm run dev:8100
```

## Platform Architecture

### Blockchain Layer
- **Asset Hub**: External Savings Account (USDT storage)
- **Moonbeam**: Ready to Commit Balance (operational funds)
- **XCM Protocol**: Cross-chain asset transfers

### Financial Rules
1. **Platform Fee**: 2% on commitments and redemptions
2. **Loan Interest**: 5% on borrowed amounts
3. **Lockup Periods**: 24h, 72h, or 7 days (enforced when borrowed)

### User Flows

#### Investor Flow
1. Connect Talisman wallet
2. Browse projects
3. XCM transfer (Asset Hub → Moonbeam)
4. Commit funds to project (2% fee)
5. Track investment
6. Redeem after lockup (2% fee)

#### Creator/Borrower Flow
1. Connect Talisman wallet
2. Create new project
3. Wait for funding
4. Borrow against funded amount
5. Repay with 5% interest

## Database Schema

See `DATABASE_SCHEMA.md` for complete documentation.

Key tables:
- `projects` - All funding campaigns
- `commitments` - Investor commitments
- `loans` - Borrower loans
- `transactions` - Complete audit trail
- `user_balances` - Cached balances

## Testing with Talisman

1. Install Talisman browser extension
2. Create/import account with Polkadot address
3. Ensure you have USDT on Asset Hub
4. Connect wallet in Bochica platform
5. Try creating a project or investing

## Troubleshooting

### Wallet Not Connecting
- Ensure Talisman extension is installed
- Check extension permissions
- Refresh the page

### Balance Shows 0
- Verify you have USDT on Asset Hub (Asset ID: 1984)
- Check correct network (Polkadot, not Kusama)
- Wait for blockchain sync

### XCM Transfer Fails
- Ensure sufficient balance for fees
- Check network connectivity
- Verify Asset Hub and Moonbeam are operational

### Supabase RLS Issues
- Verify wallet is connected
- Check browser console for errors
- Ensure `app.current_user_address` is set

## Production Deployment

### PM2 Process Manager
```bash
# Build for production
npm run build

# Start with PM2
pm2 start npm --name "bochica" -- start

# Save PM2 config
pm2 save

# Monitor
pm2 logs bochica
pm2 monit
```

### Nginx Reverse Proxy (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Notes

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use RLS policies** - Supabase Row Level Security protects private data
3. **Validate all inputs** - Financial amounts must be validated server-side
4. **Audit transactions** - All operations logged in `transactions` table
5. **Secure API keys** - Supabase anon key is safe for client use

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs
3. Verify Polkadot network status
4. Check Talisman wallet connectivity

## License

Bochica Platform - Micro-lending on Polkadot
