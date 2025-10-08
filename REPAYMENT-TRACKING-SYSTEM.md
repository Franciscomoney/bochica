# Bochica Repayment Tracking System

## Overview

The repayment tracking system monitors when project creators repay their loans by checking escrow wallet balances on the Polkadot Asset Hub blockchain.

## Components

### 1. Database Schema (`migrations/007_add_repayment_tracking.sql`)

**New columns in `projects` table:**
- `repayment_date` - When the loan was fully repaid
- `repayment_amount` - Total amount repaid (should match capital + interest)
- `last_repayment_check` - Last time the escrow wallet was checked

**New columns in `loans` table:**
- `actual_repayment_date` - Actual date repayment was detected on blockchain
- `actual_repayment_amount` - Actual amount detected in escrow wallet

**New table: `repayment_checks`**
- Audit trail of all repayment checks
- Records: project_id, escrow_balance, expected_amount, is_fully_repaid, checker_type, notes
- Provides transparency and debugging capability

**To apply migration:**
```sql
-- Run in Supabase SQL Editor
-- Copy and paste content from migrations/007_add_repayment_tracking.sql
```

### 2. Repayment API Endpoint (`app/api/repay/route.ts`)

**POST /api/repay**

Checks if a creator has repaid their loan by querying the escrow wallet on Asset Hub.

**Request:**
```json
{
  "projectId": "uuid-here",
  "checkerType": "manual" // or "automated" or "api"
}
```

**Response (repaid):**
```json
{
  "success": true,
  "repaid": true,
  "expectedAmount": 1050.00,
  "receivedAmount": 1050.00,
  "overpayment": 0,
  "message": "Repayment confirmed! Project marked as fully repaid.",
  "loanDetails": {
    "capital": 1000.00,
    "interest": 50.00,
    "totalRepayment": 1050.00,
    "dueDate": "2025-11-07T00:00:00.000Z"
  }
}
```

**Response (not repaid):**
```json
{
  "success": true,
  "repaid": false,
  "expectedAmount": 1050.00,
  "currentBalance": 500.00,
  "remaining": 550.00,
  "percentageRepaid": 47.62,
  "message": "Waiting for full repayment. 550.00 USDT remaining.",
  "escrowAddress": "1abc...",
  "loanDetails": { ... }
}
```

**GET /api/repay?projectId=uuid**

Gets cached repayment status without checking blockchain.

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "name": "Project Name",
    "status": "borrowing",
    "escrowAddress": "1abc...",
    "repaymentDate": null,
    "repaymentAmount": null,
    "lastCheck": "2025-10-07T22:00:00.000Z"
  },
  "loan": {
    "amount": 1000.00,
    "interestRate": 5.0,
    "interestAmount": 50.00,
    "totalRepayment": 1050.00,
    "status": "active",
    "dueDate": "2025-11-07T00:00:00.000Z",
    "actualRepaymentDate": null,
    "actualRepaymentAmount": null
  },
  "recentChecks": [...]
}
```

### 3. UI Component (`components/RepaymentTracker.tsx`)

A comprehensive React component for creators to:
- View loan details (capital, interest, total repayment)
- See repayment due date and days remaining
- Copy escrow wallet address
- Check repayment status with one click
- View repayment progress (percentage complete)

**Props:**
```typescript
{
  projectId: string;
  projectName: string;
  escrowAddress: string;
  expectedAmount: number;
  currentStatus: string;
  dueDate?: string;
  loanDetails?: {
    capital: number;
    interest: number;
    interestRate: number;
  };
}
```

**Integration in project detail page:**
```tsx
import RepaymentTracker from '@/components/RepaymentTracker';

// In your project page component
{project.status === 'borrowing' && loan && (
  <RepaymentTracker
    projectId={project.id}
    projectName={project.name}
    escrowAddress={project.escrow_wallet_address}
    expectedAmount={parseFloat(loan.total_repayment)}
    currentStatus={project.status}
    dueDate={loan.due_date}
    loanDetails={{
      capital: parseFloat(loan.amount),
      interest: parseFloat(loan.interest_amount),
      interestRate: parseFloat(loan.interest_rate)
    }}
  />
)}
```

### 4. Automated Checker (`app/api/repay/check-all/route.ts`)

**GET /api/repay/check-all?apiKey=YOUR_KEY**

Checks ALL projects with status "borrowing" for repayment.

**Security:** Requires API key (default: `bochica-repayment-checker-2025`)

**Response:**
```json
{
  "success": true,
  "checkedAt": "2025-10-07T22:00:00.000Z",
  "totalChecked": 5,
  "newlyRepaid": 1,
  "stillPending": 4,
  "results": [
    {
      "projectId": "uuid",
      "projectName": "Project Name",
      "repaid": true,
      "currentBalance": 1050.00,
      "expectedAmount": 1050.00,
      "remaining": 0,
      "percentageRepaid": 100
    },
    ...
  ]
}
```

**Setup automated checks:**
```bash
# SSH into OVH server
ssh debian@51.178.253.51

# Run the setup script
cd /home/debian/bochica
./setup-repayment-cron.sh
```

This creates:
- `/home/debian/bochica/scripts/check-repayments.sh` - Checker script
- Cron job running every 6 hours (0:00, 6:00, 12:00, 18:00)
- Logs to `/home/debian/bochica/logs/repayment-checker.log`

**Manual check:**
```bash
/home/debian/bochica/scripts/check-repayments.sh
```

**View logs:**
```bash
tail -f /home/debian/bochica/logs/repayment-checker.log
```

## How It Works

### Creator Workflow

1. **Project gets funded** → Status changes to "funded"
2. **Creator withdraws funds** → Status changes to "borrowing", loan record created
3. **Creator receives capital** (minus platform fee)
4. **Creator has X days to repay** (capital + interest)
5. **Creator sends repayment to escrow address**
6. **Creator clicks "Check Repayment Status"** in UI
7. **System detects full repayment** → Status changes to "repaid"

### Automated Check Workflow

1. **Cron job runs every 6 hours**
2. **Fetches all projects with status "borrowing"**
3. **For each project:**
   - Query Asset Hub for escrow wallet balance
   - Compare with expected repayment amount
   - If balance >= expected, mark as repaid
   - Record check in audit trail
4. **Log results** to repayment-checker.log

### Blockchain Integration

**Network:** Polkadot Asset Hub
**RPC:** `wss://polkadot-asset-hub-rpc.polkadot.io`
**Asset:** USDT (Asset ID: 1984)

**Query:**
```typescript
const balanceData = await api.query.assets.account(
  1984, // USDT asset ID
  escrowWalletAddress
);

const balance = balanceData.unwrapOr(null)?.balance.toString() / 1_000_000;
```

## Testing

### Manual Test

1. **Create a test project and fund it**
2. **Withdraw funds as creator**
3. **Send repayment to escrow wallet:**
   ```
   Network: Polkadot Asset Hub
   Asset: USDT (1984)
   Amount: [capital + interest]
   To: [escrow_wallet_address from project]
   ```
4. **Click "Check Repayment Status" in UI**
5. **Verify:**
   - Status changes to "repaid"
   - Repayment date recorded
   - Loan marked as repaid
   - Entry in repayment_checks table

### API Test

```bash
# Check specific project
curl -X POST https://51.178.253.51:8100/api/repay \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your-project-uuid", "checkerType": "manual"}' \
  -k

# Check all projects (automated)
curl -k "https://51.178.253.51:8100/api/repay/check-all?apiKey=bochica-repayment-checker-2025"

# Get cached status
curl -k "https://51.178.253.51:8100/api/repay?projectId=your-project-uuid"
```

## Environment Variables

Add to `/home/debian/bochica/.env.local`:

```bash
# Repayment checker API key (for automated checks)
REPAYMENT_CHECKER_API_KEY=bochica-repayment-checker-2025

# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=https://51.178.253.51:8100
```

## File Locations

**On OVH Server (51.178.253.51):**

```
/home/debian/bochica/
├── migrations/
│   └── 007_add_repayment_tracking.sql
├── app/
│   └── api/
│       └── repay/
│           ├── route.ts (main endpoint)
│           └── check-all/
│               └── route.ts (automated checker)
├── components/
│   └── RepaymentTracker.tsx
├── scripts/
│   └── check-repayments.sh (cron script)
├── logs/
│   └── repayment-checker.log
└── setup-repayment-cron.sh
```

## Security Considerations

1. **API Key Protection:** The automated checker requires an API key
2. **Blockchain Verification:** All checks query the real blockchain
3. **Audit Trail:** Every check is logged in `repayment_checks` table
4. **No Manual Overrides:** Status changes only when blockchain confirms
5. **Rate Limiting:** Automated checker includes delays between checks

## Future Enhancements

1. **Email Notifications:** Alert creators when repayment is due
2. **SMS Reminders:** Send SMS before due date
3. **Partial Repayments:** Track and allow partial repayments
4. **Late Fees:** Automatically calculate late fees after due date
5. **Dashboard:** Admin dashboard showing all repayment statuses
6. **Analytics:** Repayment rate analytics and trends

## Troubleshooting

### Issue: "Escrow wallet not found"
**Solution:** Ensure project has been withdrawn first (status: "borrowing")

### Issue: "Repayment not detected"
**Check:**
1. Creator sent to correct escrow address
2. Sent on Polkadot Asset Hub (not another network)
3. Used USDT (Asset ID 1984)
4. Sent full amount (capital + interest)

### Issue: "Automated checker not running"
**Check:**
1. Cron job installed: `crontab -l`
2. Script is executable: `ls -l /home/debian/bochica/scripts/check-repayments.sh`
3. Check logs: `tail -f /home/debian/bochica/logs/repayment-checker.log`

### Issue: "Database columns missing"
**Solution:** Run migration in Supabase SQL Editor:
```sql
-- Copy content from migrations/007_add_repayment_tracking.sql
```

## Support

For issues or questions:
- Check logs: `/home/debian/bochica/logs/repayment-checker.log`
- Check database: `repayment_checks` table in Supabase
- Test API manually: Use curl commands above
- Review blockchain: Check escrow wallet on Polkadot.js Apps

---

**Implementation Date:** October 7, 2025
**Version:** 1.0
**Author:** Claude Code (OVH Agent)
