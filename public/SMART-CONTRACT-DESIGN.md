# Bochica Smart Contract Design

## Overview
Smart contract to manage the complete lending cycle on Polkadot Asset Hub.

## 4-Step Process

### 1. DEPOSIT (Investor → Contract)
- Investor sends USDT to contract
- Contract records: project_id, investor_address, amount, lockup_period
- Tracks total funding per project
- Emits: `Deposited(project_id, investor, amount)`

### 2. WITHDRAW (Creator borrows from Contract)
- **Condition**: Project must be 100% funded
- **Who**: Only project creator
- Contract transfers all USDT to creator
- Records loan: amount, interest_rate, due_date
- Emits: `Withdrawn(project_id, creator, amount)`

### 3. REPAY (Creator → Contract)
- Creator sends principal + interest back to contract
- Contract verifies: amount >= total_repayment
- Marks loan as repaid
- Unlocks investor claims
- Emits: `Repaid(project_id, amount)`

### 4. CLAIM (Contract → Investors)
- **Condition**: Loan must be repaid AND lockup expired
- Each investor claims their share: principal + proportional interest
- Contract calculates: (investor_amount / total_funding) * total_repayment
- Transfers USDT to investor
- Emits: `Claimed(project_id, investor, amount)`

## Data Structures

```rust
struct Project {
    creator: AccountId,
    goal_amount: Balance,
    current_funding: Balance,
    interest_rate: u8,
    status: ProjectStatus, // Active, Funded, Borrowed, Repaid
}

struct Investment {
    investor: AccountId,
    amount: Balance,
    lockup_end: Timestamp,
    claimed: bool,
}

struct Loan {
    amount: Balance,
    interest_rate: u8,
    total_repayment: Balance,
    due_date: Timestamp,
    repaid: bool,
}
```

## Functions

### deposit(project_id, amount, lockup_period)
1. Transfer USDT from investor to contract
2. Record investment
3. Update project.current_funding
4. If current_funding >= goal_amount: status = Funded

### withdraw(project_id)
1. Check: caller == project.creator
2. Check: project.status == Funded
3. Transfer project.current_funding to creator
4. Create loan record
5. Update project.status = Borrowed

### repay(project_id, amount)
1. Check: caller == project.creator
2. Check: amount >= loan.total_repayment
3. Transfer USDT from creator to contract
4. Mark loan.repaid = true
5. Update project.status = Repaid

### claim(project_id)
1. Check: loan.repaid == true
2. Check: block.timestamp >= investment.lockup_end
3. Calculate share: (investment.amount / project.current_funding) * loan.total_repayment
4. Transfer share to investor
5. Mark investment.claimed = true

## Security Checks
- Only creator can withdraw
- Can't withdraw unless 100% funded
- Can't claim unless loan repaid
- Can't claim before lockup expires
- Prevent double-claiming
- Reentrancy protection

## Platform Fee
- 2% deducted on deposit
- Sent to platform wallet immediately
- Net amount goes to project

## Technology
- **Language**: ink! (Rust for Polkadot)
- **Chain**: Asset Hub (Polkadot parachain)
- **Asset**: USDT (Asset ID: 1984)
- **Deployment**: Via Contracts pallet

## Next Steps
1. Write ink! smart contract code
2. Test locally with `cargo contract test`
3. Deploy to Asset Hub testnet
4. Test all 4 functions end-to-end
5. Deploy to Asset Hub mainnet
6. Update frontend to interact with contract
