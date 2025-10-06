# Withdrawal Requests Migration

## What Changed?

The withdrawal system has been updated from a **fake "successful" message** to a proper **withdrawal request system** where admin manually processes fund transfers from the escrow wallet.

## Database Changes Required

### Step 1: Run SQL Migration

You need to create the `withdrawal_requests` table in Supabase. The SQL file is located at:
- `/home/debian/bochica/migrations/create-withdrawal-requests.sql`

**How to run it:**
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your Bochica project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `create-withdrawal-requests.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'withdrawal_requests';
```

You should see `withdrawal_requests` in the results.

### Step 3: Verify RLS Policies

Run this to check policies:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'withdrawal_requests';
```

You should see 3 policies:
- Public read withdrawal_requests
- Creators can create withdrawal_requests  
- Admins can update withdrawal_requests

## What the Fix Does

### Before (BROKEN):
- User clicks "Withdraw Funds"
- Says "Withdrawal successful!" 
- **NO ACTUAL BLOCKCHAIN TRANSACTION HAPPENS**
- Money stays in escrow, user wallet shows nothing

### After (CORRECT):
- User clicks "Request Withdrawal"
- Creates a `withdrawal_request` record with status `pending`
- Creates a `loan` record with status `pending_disbursement`
- Updates project status to `awaiting_disbursement`
- Admin receives notification to process withdrawal
- Admin manually sends USDT from escrow wallet to creator
- Admin updates withdrawal_request status to `completed`
- User receives funds in their wallet

## Next Step: Build Admin Dashboard

After running the migration, you'll want to create an admin dashboard at:
- `/home/debian/bochica/app/admin/withdrawals/page.tsx`

This dashboard should:
1. List all pending withdrawal requests
2. Show creator address, amount, project details
3. Provide buttons to approve/reject
4. On approve: Show instructions for manual transfer
5. Track blockchain transaction hash
6. Update withdrawal_request and loan status

## Testing Checklist

After deploying:
- [ ] Can create a project and fund it to 100%
- [ ] Creator sees "Request Withdrawal" button
- [ ] Clicking button creates withdrawal_request record
- [ ] Success message mentions "admin will process within 24 hours"
- [ ] No fake blockchain transactions attempted
- [ ] Project status changes to "awaiting_disbursement"
- [ ] Loan record created with status "pending_disbursement"

## Rollback (if needed)

If something goes wrong, you can rollback by:

```sql
DROP TABLE IF EXISTS withdrawal_requests CASCADE;
ALTER TABLE loans DROP COLUMN IF EXISTS withdrawal_request_id;
```

Then restore the previous version of `page.tsx` from git.
