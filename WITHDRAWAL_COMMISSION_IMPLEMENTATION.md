# Bochica Withdrawal Implementation with 2% Platform Commission

## Implementation Summary

Successfully implemented the withdrawal functionality with automatic platform commission split.

---

## Changes Made

### 1. Updated Withdrawal API (`/home/debian/bochica/app/api/withdraw/route.ts`)

**Key Changes:**
- Added platform wallet address configuration: `PLATFORM_WALLET_ADDRESS`
- Implemented 2% commission split (98% to creator, 2% to platform)
- Used Polkadot `utility.batchAll` to execute both transfers atomically
- Enhanced error handling with transaction event monitoring
- Updated loan calculation to use creator amount (not total amount)
- Added withdrawal tracking fields to project updates

**Commission Calculation:**
```typescript
const totalAmount = parseFloat(balance.available_balance);
const platformFeeAmount = Math.floor(totalAmount * PLATFORM_FEE * 100) / 100; // 2%
const creatorAmount = totalAmount - platformFeeAmount; // 98%
```

**Batch Transaction:**
```typescript
const transferToCreator = api.tx.assets.transfer(USDT_ASSET_ID, creatorAddress, creatorAmountInUnits);
const transferToPlatform = api.tx.assets.transfer(USDT_ASSET_ID, PLATFORM_WALLET, platformFeeInUnits);
const batchTx = api.tx.utility.batchAll([transferToCreator, transferToPlatform]);
```

### 2. Database Schema Updates

**Migration File:** `/home/debian/bochica/migrations/005_add_withdrawal_tracking.sql`

**New Columns Added to `projects` table:**
- `withdrawal_tx_hash` (TEXT) - Blockchain transaction hash
- `withdrawal_date` (TIMESTAMP) - When funds were withdrawn
- `platform_fee_paid` (DECIMAL 15,2) - Amount paid as commission

**Note:** This migration needs to be run manually in Supabase SQL Editor.

### 3. Environment Configuration

**Added to `.env.local`:**
```bash
PLATFORM_WALLET_ADDRESS=13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy
```

**Existing Configuration:**
```bash
NEXT_PUBLIC_PLATFORM_FEE=0.02  # 2% commission
```

### 4. Service Restart

- Backed up original file: `route.ts.backup-[timestamp]`
- Deployed updated withdrawal API
- Restarted PM2 service: `pm2 restart bochica`
- Service running at: https://51.178.253.51:8100

---

## API Response Format

The withdrawal endpoint now returns:

```json
{
  "success": true,
  "txHash": "0x...",
  "totalAmount": 1000,
  "creatorAmount": 980,
  "platformFeeAmount": 20,
  "platformFeePercentage": 2,
  "interestRate": 5,
  "totalRepayment": 1029,
  "dueDate": "2025-11-05T..."
}
```

---

## How It Works

### Withdrawal Flow:

1. **Verify Project Status**
   - Check project is fully funded (100%)
   - Verify creator owns the project
   - Ensure status is "funded"

2. **Calculate Commission Split**
   - Total amount from project balance
   - Platform fee: 2% of total
   - Creator amount: 98% of total

3. **Execute Blockchain Transaction**
   - Connect to Polkadot Asset Hub
   - Load escrow account from encrypted seed
   - Create batch transaction with two transfers:
     - Transfer 98% to creator address
     - Transfer 2% to platform wallet
   - Sign and submit with escrow account

4. **Update Database**
   - Create loan record (using creator amount)
   - Update project_balances (set available to 0)
   - Update projects table with:
     - status: 'borrowing'
     - withdrawal_tx_hash
     - withdrawal_date
     - platform_fee_paid

---

## Testing Checklist

### ⚠️ Important: Run Database Migration First

Before testing, run the following SQL in Supabase Dashboard:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS withdrawal_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS withdrawal_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_fee_paid DECIMAL(15, 2);
```

### Test Scenarios:

1. **Create Test Project**
   - Create a new project with small goal (e.g., 10 USDT)
   - Fund it to 100%
   - Verify status changes to "funded"

2. **Test Withdrawal**
   - Call withdrawal API with creator address
   - Verify transaction executes on-chain
   - Check transaction hash in response
   - Verify amounts split correctly

3. **Verify On-Chain**
   - Check creator wallet received 98%
   - Check platform wallet received 2%
   - View transaction on Polkadot.js explorer

4. **Verify Database**
   - Project status updated to "borrowing"
   - Withdrawal fields populated
   - Loan record created with correct amount
   - Project balance shows withdrawn amount

---

## API Endpoint

**URL:** `POST /api/withdraw`

**Request Body:**
```json
{
  "projectId": "uuid-here",
  "creatorAddress": "polkadot-address-here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "txHash": "0x...",
  "totalAmount": 1000,
  "creatorAmount": 980,
  "platformFeeAmount": 20,
  "platformFeePercentage": 2,
  "interestRate": 5,
  "totalRepayment": 1029,
  "dueDate": "2025-11-05T..."
}
```

**Error Responses:**
- 400: Missing parameters, not fully funded, wrong status
- 403: Unauthorized (not project creator)
- 404: Project not found
- 500: Server error or blockchain transaction failed

---

## Frontend Integration

The frontend withdrawal button should:

1. **Display Fee Breakdown**
   - Show total amount
   - Show creator amount (98%)
   - Show platform fee (2%)
   - Show interest and repayment details

2. **Call API**
   ```typescript
   const response = await fetch('/api/withdraw', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       projectId: project.id,
       creatorAddress: currentUser.address
     })
   });
   ```

3. **Handle Response**
   - Show loading during transaction
   - Display transaction hash on success
   - Show error message on failure
   - Update UI to reflect "borrowing" status

---

## Configuration

### Platform Wallet
**Address:** `13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy`
**Network:** Polkadot Asset Hub
**Asset:** USDT (Asset ID: 1984)

### Commission Rate
**Default:** 2% (configurable via `NEXT_PUBLIC_PLATFORM_FEE`)
**Can be changed** in `.env.local` if needed

---

## Security Considerations

1. **Escrow Account Security**
   - Seed phrase encrypted with AES-256-CBC
   - Encryption key stored in environment variable
   - Never exposed to frontend

2. **Authorization Checks**
   - Verifies creator owns project
   - Checks project is fully funded
   - Validates project status before withdrawal

3. **Atomic Transactions**
   - Uses `batchAll` for atomic execution
   - Both transfers succeed or both fail
   - Prevents partial withdrawals

4. **Database Consistency**
   - Updates all tables in correct order
   - Tracks withdrawal in multiple places
   - Loan record tied to blockchain transaction

---

## Known Issues & Next Steps

### Issues:
1. **Database Migration Manual** - The migration needs to be run manually in Supabase Dashboard
2. **No Frontend Updates Yet** - Frontend still needs to show fee breakdown

### Next Steps:
1. Run database migration in Supabase
2. Update frontend withdrawal UI to show:
   - Fee breakdown before confirmation
   - Transaction status during processing
   - Success message with amounts
3. Add withdrawal history page showing past transactions
4. Consider adding withdrawal requests approval system for security

---

## Files Modified

1. `/home/debian/bochica/app/api/withdraw/route.ts` - Updated with commission split
2. `/home/debian/bochica/migrations/005_add_withdrawal_tracking.sql` - New migration
3. `/home/debian/bochica/.env.local` - Added PLATFORM_WALLET_ADDRESS

---

## Backup Files

**Original withdrawal route backed up at:**
`/home/debian/bochica/app/api/withdraw/route.ts.backup-[timestamp]`

To rollback if needed:
```bash
cd /home/debian/bochica/app/api/withdraw
cp route.ts.backup-[timestamp] route.ts
pm2 restart bochica
```

---

## Contact & Support

**Server:** OVH Debian (51.178.253.51)
**Application:** https://51.178.253.51:8100
**PM2 Process:** bochica
**Logs:** `pm2 logs bochica`

---

**Implementation Date:** October 6, 2025
**Status:** ✅ Complete (Pending database migration and frontend updates)
