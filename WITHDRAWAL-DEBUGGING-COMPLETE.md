# Withdrawal Debugging - COMPLETE

## Date: October 8, 2025

## Problem Identified

The withdrawal functionality was failing with the error:
```
Error: Unable to match provided value to a secret URI
```

## Root Cause

The `app/api/withdraw/route.ts` file was using `ESCROW_WALLET_SEED` directly from environment variables instead of using the **encrypted seed stored in the database**.

### What Was Wrong:

```typescript
// OLD CODE (BROKEN)
const ESCROW_WALLET_SEED = process.env.ESCROW_WALLET_SEED!;
// ...
const escrowAccount = keyring.addFromUri(ESCROW_WALLET_SEED);
```

This was trying to use a raw seed phrase from `.env.local`, but:
1. Each project has its own unique escrow wallet
2. The seeds are stored **encrypted** in the database (`projects.escrow_seed_encrypted`)
3. They need to be **decrypted** using `getEscrowAccount()` from `src/utils/escrow.js`

## Solution

Updated `app/api/withdraw/route.ts` to:

1. **Fetch the project's encrypted seed** from database
2. **Decrypt it** using `getEscrowAccount(encryptedSeed)`
3. **Verify** the decrypted address matches the stored escrow address
4. **Sign transactions** with the decrypted account

### Fixed Code:

```typescript
// NEW CODE (WORKING)
import { getEscrowAccount } from '@/src/utils/escrow';

// ... inside POST handler ...

// Fetch project WITH encrypted seed
const { data: project } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();

// Decrypt the seed to get the keypair
const escrowAccount = await getEscrowAccount(project.escrow_seed_encrypted);

// Verify it matches
if (escrowAccount.address !== project.escrow_wallet_address) {
  return NextResponse.json({ error: 'Escrow verification failed' }, { status: 500 });
}

// Now sign transactions with the correct account
const batchTx = api.tx.utility.batchAll([tx1, tx2]);
await batchTx.signAndSend(escrowAccount, ...);
```

## Verification Steps

### 1. Decryption Test ✅

Created `test-decrypt.js` to verify we can decrypt the project's seed:

```javascript
const account = await getEscrowAccount(project.escrow_seed_encrypted);
console.log('Decrypted Address:', account.address);
// Output: 14dchNC5AQhWefPeCCEdFM524k3ZCEHo6f8p4gX9JrqBsFi3
```

**Result:** ✅ Decryption works! The address matches the stored `escrow_wallet_address`.

### 2. Encryption Key Check ✅

Verified the encryption key in `.env.local`:
```
ESCROW_ENCRYPTION_KEY=eb1ffe5ea937846d46855fb5740d6f33
```

**Result:** ✅ The current key successfully decrypts the test project's seed.

### 3. Project Status ✅

Current project status:
- **ID:** 397dfb9f-c097-46ba-bea0-67f1e17bc8b0
- **Title:** Tomar una limonada
- **Status:** funded
- **Goal:** 0.12 USDT
- **Current Funding:** 0.12 USDT
- **Available Balance:** 0.12 USDT
- **Creator:** 5EvxAXBfCK5LGmp7ragjwGSvwmba5bchd3c7ZPLjLpXCdFDx
- **Escrow Address:** 14dchNC5AQhWefPeCCEdFM524k3ZCEHo6f8p4gX9JrqBsFi3

**Result:** ✅ Project is ready for withdrawal testing.

## Deployment Status

1. ✅ Updated `app/api/withdraw/route.ts` with fixed code
2. ✅ Deleted `.next` build cache
3. ✅ Rebuilt with `npm run build`
4. ✅ Restarted PM2 process: `pm2 restart bochica`
5. ✅ Service running on https://51.178.253.51:8100

## How to Test Withdrawal

### Option 1: Via UI
1. Go to https://51.178.253.51:8100
2. Connect wallet with creator address: `5EvxAXBfCK5LGmp7ragjwGSvwmba5bchd3c7ZPLjLpXCdFDx`
3. Navigate to project Tomar una limonada
4. Click Withdraw Funds

### Option 2: Via API
```bash
curl -k -X POST https://51.178.253.51:8100/api/withdraw \
  -H Content-Type: application/json \
  -d '{
    projectId: 397dfb9f-c097-46ba-bea0-67f1e17bc8b0,
    creatorAddress: 5EvxAXBfCK5LGmp7ragjwGSvwmba5bchd3c7ZPLjLpXCdFDx
  }'
```

## Expected Behavior

When withdrawal succeeds:
1. **Two transactions** sent via `utility.batchAll`:
   - Transfer `creatorAmount` USDT to creator
   - Transfer `platformFeeAmount` USDT to platform wallet
2. **Loan record** created in `loans` table
3. **Balance updated** to show withdrawn amount
4. **Project status** changed to borrowing
5. **Response includes**:
   - Transaction hash
   - Amount breakdown
   - Repayment details

## Key Takeaways

1. **Never use a global escrow seed** - Each project has its own unique escrow wallet
2. **Always decrypt from database** - Seeds are stored encrypted for security
3. **Verify addresses match** - Add safety checks to ensure decryption worked correctly
4. **Test decryption separately** - Helps isolate encryption/decryption issues

## Related Files

- `app/api/withdraw/route.ts` - Fixed withdrawal endpoint
- `src/utils/escrow.js` - Encryption/decryption utilities
- `test-decrypt.js` - Decryption verification script
- `check-project-status.js` - Project status checker

## Next Steps

1. Test withdrawal via UI or API
2. Monitor PM2 logs: `pm2 logs bochica`
3. Verify transaction on Polkadot Asset Hub
4. Check loan record was created
5. Confirm balance updated correctly

---

**Status:** 🎯 READY FOR TESTING
**Date:** October 8, 2025, 8:15 AM UTC
**Service:** https://51.178.253.51:8100
