# How to Continue Building Bochica

## Current State

✅ **Foundation Complete (Phase 1)**
- Next.js 14 project created with TypeScript and Tailwind CSS
- All blockchain dependencies installed (@polkadot/api, @polkadot/extension-dapp)
- Database schema fully designed and documented
- Financial rules engine implemented
- Wallet context provider created
- Supabase client configured
- XCM transfer logic implemented

## What's Built

### 📁 Files Created

1. **DATABASE_SCHEMA.md** - Complete database documentation
2. **supabase-setup.sql** - Ready to run in Supabase
3. **lib/supabase.ts** - Supabase client and TypeScript types
4. **lib/polkadot.ts** - Blockchain integration (Talisman, XCM, balances)
5. **lib/financial.ts** - All financial calculations and validations
6. **contexts/WalletContext.tsx** - React context for wallet state
7. **.env.local** - Environment template
8. **SETUP.md** - Complete setup guide
9. **MVP_STATUS.md** - Current progress tracker

### 🏗️ Architecture

```
/bochica
├── app/
│   ├── layout.tsx          [NEEDS: Wrap with WalletProvider]
│   ├── page.tsx            [NEEDS: Project browsing UI]
│   ├── project/[id]/       [NEEDS: Project detail page]
│   ├── create/             [NEEDS: Create project form]
│   ├── dashboard/          [NEEDS: User dashboards]
│   └── api/
│       ├── projects/       [NEEDS: CRUD endpoints]
│       ├── commitments/    [NEEDS: Investment endpoints]
│       └── loans/          [NEEDS: Loan endpoints]
├── components/
│   ├── Header.tsx          [NEEDS: Wallet connect button]
│   ├── ProjectCard.tsx     [NEEDS: Project display card]
│   ├── CommitForm.tsx      [NEEDS: Investment form]
│   └── ...                 [NEEDS: More components]
├── lib/
│   ├── supabase.ts         ✅ DONE
│   ├── polkadot.ts         ✅ DONE
│   └── financial.ts        ✅ DONE
├── contexts/
│   └── WalletContext.tsx   ✅ DONE
└── ...config files         ✅ DONE
```

## Next Steps to Get MVP Running

### Step 1: Set Up Supabase (5 minutes)

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Create new project named "bochica"
# 3. Go to SQL Editor
# 4. Copy contents of supabase-setup.sql
# 5. Run the SQL
# 6. Go to Settings → API
# 7. Copy URL and anon key
# 8. Add to .env.local:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Build Core UI Components (30 minutes)

#### A. Update Root Layout
```typescript
// app/layout.tsx
import { WalletProvider } from '@/contexts/WalletContext'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
```

#### B. Create Header Component
```typescript
// components/Header.tsx
- Bochica logo
- Navigation (Browse, Create, Dashboard)
- Wallet connect button
- Balance display (Asset Hub + Moonbeam)
```

#### C. Create Project Card Component
```typescript
// components/ProjectCard.tsx
- Project image
- Title and description
- Funding progress bar
- Goal amount
- "View Details" button
```

### Step 3: Build Home Page (20 minutes)

```typescript
// app/page.tsx
- Fetch projects from Supabase
- Display grid of ProjectCard components
- Real-time updates via Supabase subscriptions
- Filter by status (active, funded)
```

### Step 4: Create API Routes (30 minutes)

#### Projects API
```typescript
// app/api/projects/route.ts
- GET: List all projects
- POST: Create new project

// app/api/projects/[id]/route.ts
- GET: Get project details
- PATCH: Update project
```

#### Commitments API
```typescript
// app/api/commitments/route.ts
- POST: Create commitment
  1. Validate amount
  2. Check XCM transfer completed
  3. Calculate fee (2%)
  4. Insert into DB
  5. Update project funding
```

### Step 5: Build Project Detail Page (30 minutes)

```typescript
// app/project/[id]/page.tsx
- Project details
- Funding progress
- Commitment form
- XCM transfer flow
- Lockup period selector
```

### Step 6: Test & Deploy (15 minutes)

```bash
# Configure firewall
sudo ufw allow 8100

# Run on port 8100
npm run dev -- -p 8100

# Access at:
http://localhost:3000
```

## Quick Implementation Guide

### Priority 1: Get Something Visible (1 hour)

1. Update `app/layout.tsx` to include WalletProvider
2. Create simple `components/Header.tsx` with wallet button
3. Update `app/page.tsx` to show "Welcome to Bochica"
4. Test wallet connection works

### Priority 2: Projects Display (1 hour)

1. Create `components/ProjectCard.tsx`
2. Create API route `app/api/projects/route.ts`
3. Update home page to fetch and display projects
4. Add "Create Project" button

### Priority 3: Create Project Flow (1 hour)

1. Create `app/create/page.tsx` with form
2. Add POST handler in projects API
3. Validate creator is wallet owner
4. Test creating a project

### Priority 4: Investment Flow (2 hours)

1. Create project detail page
2. Build XCM transfer UI
3. Add commitment form
4. Implement lockup selection
5. Calculate and show fees
6. Test end-to-end investment

## Testing Checklist

- [ ] Wallet connects via Talisman
- [ ] Balances display correctly (Asset Hub + Moonbeam)
- [ ] Can create a project
- [ ] Project appears in list
- [ ] Can view project details
- [ ] XCM transfer UI works
- [ ] Can commit funds
- [ ] 2% fee calculated correctly
- [ ] Lockup period applied
- [ ] Real-time funding updates
- [ ] Can redeem after lockup
- [ ] Can borrow as creator
- [ ] Repayment with 5% interest works

## Common Issues & Solutions

### Wallet Not Connecting
```typescript
// Check if extension is installed
if (!window.injectedWeb3) {
  alert('Please install Talisman wallet')
}
```

### Balance Shows 0
- Ensure you're on Polkadot (not Kusama)
- Check Asset ID is 1984 (USDT)
- Wait for blockchain sync

### XCM Transfer Fails
- Check you have enough DOT for fees
- Verify both parachains are operational
- Check console for detailed errors

### Supabase RLS Blocks Query
```typescript
// Make sure to set user address
import { setUserAddress } from '@/lib/supabase'
await setUserAddress(walletAddress)
```

## File Templates to Speed Up Development

### Component Template
```typescript
'use client';
import { useWallet } from '@/contexts/WalletContext';

export default function MyComponent() {
  const { selectedAccount, isConnected } = useWallet();

  if (!isConnected) {
    return <div>Please connect wallet</div>
  }

  return <div>Component content</div>
}
```

### API Route Template
```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## Production Deployment

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "bochica" -- start -- -p 8100

# Monitor
pm2 logs bochica
pm2 monit

# Save config
pm2 save
pm2 startup
```

## Resources

- **Polkadot.js Docs**: https://polkadot.js.org/docs/
- **Talisman Docs**: https://docs.talisman.xyz/
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **XCM Format**: https://wiki.polkadot.network/docs/learn-xcm

## Contact & Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs: `npm run dev`
3. Verify Supabase connection
4. Test Talisman wallet independently
5. Check blockchain explorer for transaction status

## Project Status: Ready for Phase 2

All foundation work is complete. You can now:
1. Set up Supabase database
2. Start building UI components
3. Create API routes
4. Test with Talisman wallet
5. Deploy on port 8100

**Estimated time to MVP: 4-6 hours of focused development**

Good luck building Bochica! 🚀
