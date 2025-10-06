# Bochica Platform Commission Wallet Configuration

## Overview
The Bochica platform now automatically transfers the 2% platform fee to the designated Bochica commission wallet during each investment transaction.

## Commission Wallet Address
**Polkadot Asset Hub Address**: `13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy`

This wallet is configured in `.env.local` as:
```
NEXT_PUBLIC_BOCHICA_WALLET=13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy
```

## How It Works

### Investment Flow with Commission Transfer:

1. **Lender Commits Funds** - User initiates investment through the project detail page
2. **Amount Validation** - System validates the investment amount and user's balance
3. **Platform Fee Calculation** - 2% fee is calculated from the investment amount
4. **Fee Transfer to Bochica Wallet** - Platform fee is automatically transferred to the commission wallet
5. **Net Amount Transfer** - Remaining amount (98%) proceeds to the project via XCM to Moonbeam
6. **Database Records** - Transaction is recorded with fee details

### Technical Implementation:

#### Files Modified:

**1. **
- Added `transferAssetViaXCM()` - Generic USDT transfer function on Asset Hub
- Added `transferPlatformFee()` - Dedicated function to transfer fees to Bochica wallet

**2. **
- Updated import to include `transferPlatformFee`
- Added Step 2.5 in `handleInvest()` function to transfer platform fee
- Fixed lockup period default value from '24h' to '5min'

**3. **
- Added `NEXT_PUBLIC_BOCHICA_WALLET` environment variable

### Code Example:

```typescript
// Step 2.5: Transfer platform fee to Bochica wallet
console.log(Transferring platform fee to Bochica wallet...);
const feeTransferResult = await transferPlatformFee(
  selectedAccount.address,
  platformFee
);

if (!feeTransferResult.success) {
  console.warn(Platform fee transfer failed:, feeTransferResult.error);
  // Note: We continue even if fee transfer fails to avoid blocking the investment
  // The fee can be collected later through database records
}
```

## Important Notes:

1. **Non-Blocking Design**: If the fee transfer fails, the investment still proceeds. This ensures users are never blocked from investing due to temporary issues.

2. **Fee Collection Fallback**: All platform fees are recorded in the database (`commitments` table under `platform_fee` column), allowing for manual collection if automatic transfer fails.

3. **Asset Type**: Fees are transferred as USDT (Asset ID 1984) on Polkadot Asset Hub.

4. **Transaction Records**: Each fee transfer generates a transaction hash that can be verified on-chain.

## Monitoring Commission Wallet

To check the current balance of the commission wallet:

1. **Via Polkadot.js Apps**:
   - Visit https://polkadot.js.org/apps/?rpc=wss://polkadot-asset-hub-rpc.polkadot.io#/assets
   - Navigate to Network > Assets
   - Search for USDT (Asset ID 1984)
   - Enter wallet address: `13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy`

2. **Via Subscan**:
   - Visit https://assethub-polkadot.subscan.io/
   - Search for the wallet address

## Database Schema Reference

Platform fees are stored in the `commitments` table:

```sql
CREATE TABLE commitments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  investor_address TEXT NOT NULL,
  amount DECIMAL NOT NULL,           -- Total investment amount
  net_amount DECIMAL NOT NULL,       -- Amount after platform fee (98%)
  platform_fee DECIMAL NOT NULL,     -- Fee amount (2%)
  lockup_period TEXT,
  lockup_expiry TIMESTAMP,
  status TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP
);
```

## Deployment

Changes were deployed on: **Thu Oct  2 09:44:37 AM UTC 2025**

Application status: **Running on https://51.178.253.51:8100**

## Backup Files Created

- `lib/polkadot.ts.backup-*` - Original polkadot library
- `app/project/[id]/page.tsx.backup-*` - Original project detail page

## Testing Recommendations

1. Make a small test investment (e.g., 1 USDT)
2. Verify platform fee transfer in browser console logs
3. Check Bochica wallet balance on Asset Hub
4. Verify database records show correct `platform_fee` amount
5. Test failure scenarios (insufficient balance, etc.)

---

**Configuration completed by**: Claude Code Assistant
**Date**: Thu Oct  2 09:44:37 AM UTC 2025
