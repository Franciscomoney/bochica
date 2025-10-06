# Bochica Platform - Updated Architecture (Escrow Model)

## Major Simplification: Removed Moonbeam, Using Asset Hub Only

### Previous (Overcomplicated) Architecture:
- Lender commits funds
- Funds transferred to Moonbeam via XCM
- Then... nowhere? (bug - funds went back to lender)

### New (Correct) Architecture:
All transactions happen on **Polkadot Asset Hub** only!

## Current Money Flow

### When Lender Commits Funds:

1. **Platform Fee (2%)** → Bochica Commission Wallet
   - Wallet: `13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy`
   - Immediate transfer
   - Recorded in database

2. **Net Amount (98%)** → Project Escrow Wallet
   - Wallet: `15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf`
   - Held in escrow until project reaches funding goal
   - All commitments accumulate here

### When Project Reaches Funding Goal:

**(To be implemented next)**
- Creator can request withdrawal
- Escrow wallet → Creator's wallet
- Funds transfer with proper authorization

## Why This Works Better

1. **No Cross-Chain Complexity**: Everything stays on Asset Hub
2. **Single Chain**: Simpler, faster, cheaper
3. **Proper Escrow**: Lenders are protected - funds don't go directly to creator
4. **Transparent**: All transactions visible on Asset Hub explorer

## Code Changes Made

### 1. Environment Variables (`.env.local`)
```bash
# Commission wallet (receives 2% fee)
NEXT_PUBLIC_BOCHICA_WALLET=13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy

# Escrow wallet (holds committed funds)
NEXT_PUBLIC_PROJECT_ESCROW_WALLET=15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf
```

### 2. New Function (`lib/polkadot.ts`)
```typescript
export const transferToProjectEscrow = async (
  fromAddress: string,
  netAmount: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }>
```

### 3. Updated Investment Flow (`app/project/[id]/page.tsx`)
```typescript
// Step 1: Transfer platform fee to Bochica wallet (2%)
const feeTransferResult = await transferPlatformFee(
  selectedAccount.address,
  platformFee
);

// Step 2: Transfer net amount to project escrow wallet (98%)
const escrowTransferResult = await transferToProjectEscrow(
  selectedAccount.address,
  netAmount
);
```

## Removed Code

- ❌ `transferToMoonbeam()` - No longer needed
- ❌ `transferAssetHubToMoonbeam()` - Removed
- ❌ Moonbeam-related XCM transfers - Not required
- ❌ All Moonbeam balance checks - Unnecessary

## Database Schema

The `commitments` table tracks all lender commitments:

```sql
CREATE TABLE commitments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  investor_address TEXT NOT NULL,
  amount DECIMAL NOT NULL,           -- Total committed amount
  net_amount DECIMAL NOT NULL,       -- Amount in escrow (98%)
  platform_fee DECIMAL NOT NULL,     -- Fee sent to Bochica (2%)
  lockup_period TEXT,
  lockup_expiry TIMESTAMP,
  status TEXT,                       -- 'active', 'withdrawn', 'refunded'
  transaction_hash TEXT,             -- Escrow transfer hash
  created_at TIMESTAMP
);
```

## Next Steps to Implement

1. **Creator Withdrawal Function**
   - Check if project reached funding goal
   - Transfer from escrow to creator's wallet
   - Update project status to 'funded'
   - Update commitments to 'withdrawn'

2. **Refund Function**
   - If lockup expires before funding goal
   - Transfer from escrow back to lenders
   - Proportional distribution
   - Update commitments to 'refunded'

3. **Repayment Function**
   - Creator repays principal + interest
   - Interest distributed to lenders proportionally
   - Update commitments to 'repaid'

## Testing Checklist

- [ ] Lender commits funds
- [ ] Platform fee arrives in Bochica wallet
- [ ] Net amount arrives in escrow wallet
- [ ] Database records are correct
- [ ] Transaction hashes are valid
- [ ] Balances update correctly

## Deployment

- **Date**: Thu Oct  2 09:59:56 AM UTC 2025
- **Version**: Escrow Model v1.0
- **URL**: https://51.178.253.51:8100
- **Status**: ✅ Running

---

**Key Improvement**: Removed unnecessary Moonbeam integration, simplified to single-chain (Asset Hub) architecture with proper escrow protection for lenders.
