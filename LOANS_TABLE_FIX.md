# Loans Table Migration Fix

## Problem
The loans table was incorrectly referencing a `users` table that doesn't exist in Bochica's schema. Bochica uses wallet-based authentication (Talisman/Polkadot), not a traditional users table.

## Solution

### Files Created

1. **migrations/008_fix_loans_table.sql** - Migration to fix existing database
2. **supabase-setup-fixed.sql** - Corrected schema for new deployments

### Key Changes

**BEFORE (Incorrect):**
```sql
CREATE TABLE loans (
  borrower_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- ❌ WRONG
  ...
);
```

**AFTER (Correct):**
```sql
CREATE TABLE loans (
  borrower_address TEXT NOT NULL,  -- ✅ Polkadot wallet address
  ...
);
```

### What the Fix Does

The migration `008_fix_loans_table.sql`:

1. **Checks for old column** - If `borrower_id` exists, drops it
2. **Ensures correct column** - Adds `borrower_address` if missing
3. **Adds repayment tracking** - Includes columns from migration 007
4. **Documents schema** - Adds comments explaining the design

### How to Apply

**Option 1: Run the migration (if table exists)**
```bash
# Apply via Supabase SQL Editor or directly
# Copy content from migrations/008_fix_loans_table.sql and run it
```

**Option 2: Fresh setup (new database)**
```bash
# Use the corrected setup file
# Copy content from supabase-setup-fixed.sql
```

## Correct Schema

The `loans` table should have:

- `id` - UUID primary key
- `project_id` - UUID reference to projects table
- `borrower_address` - TEXT (wallet address, NOT user ID)
- `principal_amount` - DECIMAL(15, 2)
- `interest_amount` - DECIMAL(15, 2)
- `total_repayment` - DECIMAL(15, 2)
- `status` - TEXT (active/repaid/defaulted)
- `borrowed_at` - TIMESTAMP
- `due_date` - TIMESTAMP
- `repaid_at` - TIMESTAMP
- `actual_repayment_date` - TIMESTAMP
- `actual_repayment_amount` - DECIMAL(15, 2)

## Why This Design?

Bochica is a **decentralized lending platform** using:

- **Polkadot parachains** (Asset Hub, Moonbeam)
- **Talisman wallet** for authentication
- **No centralized user database**

Users are identified by their **wallet addresses**, not database user IDs.

Therefore:
- ✅ Use `borrower_address TEXT`
- ❌ Don't use `borrower_id UUID REFERENCES users(id)`

## Files Modified

- `/home/debian/bochica/migrations/008_fix_loans_table.sql` - New migration
- `/home/debian/bochica/supabase-setup-fixed.sql` - Corrected schema

## Original Files (Reference)

- `/home/debian/bochica/supabase-setup.sql` - Original (had correct schema)
- `/home/debian/bochica/migrations/007_add_repayment_tracking.sql` - Previous migration

## Verification

After applying the fix, verify the loans table has `borrower_address` column and NOT `borrower_id`.

Expected columns:
- id (uuid)
- project_id (uuid)
- **borrower_address (text)** ✅
- principal_amount (numeric)
- interest_amount (numeric)
- total_repayment (numeric)
- status (text)
- borrowed_at (timestamp)
- due_date (timestamp)
- repaid_at (timestamp)
- actual_repayment_date (timestamp)
- actual_repayment_amount (numeric)

**NOT** `borrower_id` ❌

## Status

- ✅ Migration created: `migrations/008_fix_loans_table.sql`
- ✅ Corrected schema: `supabase-setup-fixed.sql`
- ⏳ Ready to apply to database
