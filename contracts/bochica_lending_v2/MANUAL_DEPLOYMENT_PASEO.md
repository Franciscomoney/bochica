# Manual Deployment to Paseo Asset Hub

## ⚠️ IMPORTANT: Automated deployment requires seed phrase storage
For security, we recommend deploying manually via Polkadot.js UI instead.

## Step-by-Step Manual Deployment:

### 1. Open Polkadot.js Apps
**URL**: https://polkadot.js.org/apps/?rpc=wss://paseo-asset-hub-rpc.polkadot.io#/contracts

### 2. Connect Your Wallet
- Make sure you have 5,000 PAS in your wallet
- Connect Talisman or Polkadot.js extension
- Ensure you're connected to **Paseo Asset Hub**

### 3. Upload Contract
- Click **"Upload & deploy code"**
- Choose file: **bochica_lending_v2.contract**
  - Full path: `/home/debian/bochica/contracts/bochica_lending_v2/target/ink/bochica_lending_v2.contract`
- Click **"Next"**

### 4. Set Constructor Parameters
The contract requires one parameter:

**platform_wallet**: `13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy`

This is the wallet that will receive platform fees (10% of loan interest).

### 5. Deploy Contract
- Review deployment details
- Set gas limit (automatic estimation should work)
- Click **"Deploy"**
- Sign transaction with your wallet
- Expected gas cost: ~0.5-1 PAS

### 6. Save Contract Address
After successful deployment:
1. Copy the deployed contract address
2. Save it to: `/home/debian/bochica/CONTRACT_ADDRESS_PASEO.txt`
3. Update your frontend configuration

### 7. Verify Deployment
Test the contract:
1. Click on your deployed contract
2. Call: `get_platform_wallet()`
3. Expected result: `13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy`

---

## Alternative: Automated Deployment (Not Recommended)

If you want automated deployment, you'll need to:

1. Install dependencies:
```bash
npm install @polkadot/api @polkadot/api-contract
```

2. Provide your wallet seed phrase (12 words)

3. Run:
```bash
node deploy-paseo-automated.js
```

**Security Warning**: Only use automated deployment if you're comfortable storing your seed phrase temporarily.

---

## Troubleshooting

**Error: "Insufficient balance"**
- Ensure your wallet has at least 1 PAS for gas fees

**Error: "Contract reverted"**
- Check that platform_wallet address is valid SS58 format

**Error: "Connection failed"**
- Verify Paseo Asset Hub RPC is online
- Try alternative RPC: wss://rpc-asset-hub-paseo.polkadot.io

**Gas estimation too high**
- Try manual gas limit: 100,000,000,000 (100 billion)

---

## Next Steps After Deployment

1. **Save contract address** to `CONTRACT_ADDRESS_PASEO.txt`
2. **Update frontend** with contract address
3. **Test core functions**:
   - Create project
   - Invest in project
   - Release funds
   - Withdraw platform fees
4. **Document** contract address in project README

---

## Contract Constructor Details

```rust
pub fn new(platform_wallet: AccountId) -> Self
```

**Parameters**:
- `platform_wallet`: The account that receives 10% platform fees from loan interest

**Initial State**:
- No projects
- No investments
- Platform wallet set
- Ready for project creation
