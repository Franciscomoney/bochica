# Bochica Lending Smart Contract

Polkadot ink! smart contract for micro-lending platform on Asset Hub.

## Architecture

- **Language**: Rust (ink!)
- **Target**: Polkadot Asset Hub
- **Asset**: USDT (via XCM)

## Current Implementation Status

✅ **COMPLETED**: deposit() function - Line 151
✅ **COMPLETED**: withdraw() function - Line 217
✅ **COMPLETED**: repay() function - Line 273
✅ **COMPLETED**: claim() function - Line 319

### deposit() Function Features:
- Investors deposit USDT to fund projects
- 2% platform fee deducted automatically
- Records investment with lockup period
- Updates project funding status
- Emits Deposited event

### withdraw() Function Features:
- Creators withdraw when project is 100% funded
- Calculates total repayment with interest
- Creates loan record with 30-day due date
- Transfers funds to creator
- Updates project status to Borrowed

### repay() Function Features:
- Creators repay loan with interest
- Verifies repayment amount covers total due
- Marks loan as repaid
- Updates project status to Repaid
- Funds held in contract for investor claims

### claim() Function Features:
- Investors claim after loan repaid AND lockup expired
- Calculates proportional share: (investment / total_funding) * total_repayment
- Prevents double-claiming
- Transfers capital + interest to investor
- Example: Invested 100 USDT of 1000 total, get 10% of repayment (110 USDT if 10% interest)

## Smart Contract Complete! 🎉

All 4 core functions implemented:
1. **deposit()** - Investors fund projects
2. **withdraw()** - Creators borrow when 100% funded
3. **repay()** - Creators pay back with interest
4. **claim()** - Investors get returns

**Next Steps:**
- Compile and test contract locally
- Deploy to Asset Hub testnet
- Test full lifecycle end-to-end
- Deploy to mainnet
- Update frontend to interact with contract

## Project Lifecycle

1. **Create Project** - Creator sets goal amount and interest rate
2. **Deposit Phase** - Investors deposit USDT (with 2% platform fee)
3. **Withdrawal** - Creator withdraws when 100% funded (30-day loan created)
4. **Repayment** - Creator repays loan + interest
5. **Claim Phase** - Investors claim proportional returns after lockup

## Error Handling

- ZeroAmount - Deposit/repay amount is 0
- ProjectNotFound - Project ID doesn't exist
- ProjectNotActive - Project is not accepting deposits
- TransferFailed - USDT transfer failed
- Unauthorized - Caller is not project creator
- ProjectNotFunded - Project not 100% funded
- LoanNotFound - Loan record doesn't exist
- LoanNotRepaid - Loan hasn't been repaid yet
- LockupNotExpired - Lockup period still active
- AlreadyClaimed - Investment already claimed
- AlreadyRepaid - Loan already repaid
- InsufficientRepayment - Repayment amount too low
- InvestmentNotFound - Investment record doesn't exist

## Build Instructions

```bash
# Install ink! CLI
cargo install cargo-contract --force

# Build contract
cargo contract build

# Run tests
cargo test

# Deploy to testnet
cargo contract upload --suri //Alice
cargo contract instantiate --suri //Alice --args <platform_wallet>
```

## Total Lines: 395
