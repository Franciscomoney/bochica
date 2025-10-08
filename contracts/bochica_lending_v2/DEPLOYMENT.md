# Bochica Smart Contract Deployment Guide - PASEO TESTNET

## Compilation Complete ✅

### Build Artifacts:
- **WASM**: target/ink/bochica_lending_v2.wasm (11.4 KB)
- **Contract**: target/ink/bochica_lending_v2.contract (38 KB) **← UPLOAD THIS**
- **Metadata**: target/ink/bochica_lending_v2.json (40 KB)

## Deployment to Paseo Asset Hub (TESTNET)

### Why Paseo First?
- **Test network** - No real funds at risk
- **Free testnet DOT** - Get from faucet
- **Same as mainnet** - Identical functionality
- **Safe testing** - Test full lifecycle before mainnet

### Prerequisites:

1. **Get Testnet DOT:**
   - Faucet: https://faucet.polkadot.io/paseo
   - Request ~5 PAS (Paseo testnet DOT)
   - Need for deployment gas fees

2. **Polkadot.js Apps:**
   - URL: https://polkadot.js.org/apps/
   - Network: Switch to **Paseo Asset Hub**
   
3. **Wallet:**
   - Talisman or Polkadot.js extension
   - Connected to Paseo network

### Step-by-Step Deployment:

#### 1. Connect to Paseo Asset Hub
   - Open: https://polkadot.js.org/apps/
   - Click top-left network selector
   - Test Networks → **Paseo Asset Hub**
   - Wait for connection (green indicator)

#### 2. Get Testnet Funds
   - Go to: https://faucet.polkadot.io/paseo
   - Enter your wallet address
   - Request 5 PAS tokens
   - Wait ~30 seconds for confirmation

#### 3. Upload Contract
   - Developer → Contracts
   - Click "Upload & deploy code"
   - **Upload file**: `/home/debian/bochica/contracts/bochica_lending_v2/target/ink/bochica_lending_v2.contract`
   - Click "Next"

#### 4. Set Constructor Parameters
   - **platform_wallet**: Your wallet address (receives 2% fees)
   - Example: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
   - Click "Next"

#### 5. Deploy
   - Review deployment details
   - Click "Deploy"
   - Sign transaction in wallet
   - Wait for confirmation (~12 seconds)

#### 6. Save Contract Address
   - Copy the contract address (starts with 5...)
   - Save to: `/home/debian/bochica/CONTRACT_ADDRESS.txt`
   - This is needed for frontend integration

### Verification Steps:

After deployment, test these calls:

1. **Verify Platform Wallet:**
   ```
   Call: get_platform_wallet()
   Expected: Your wallet address
   ```

2. **Create Test Project:**
   ```
   Call: create_project(goal_amount: 1000000, interest_rate: 10)
   Expected: Returns project_id: 1
   ```

3. **Check Project:**
   ```
   Call: get_project(project_id: 1)
   Expected: Project details with your address as creator
   ```

## Contract Address (Paseo Testnet):
```
[WILL BE FILLED AFTER DEPLOYMENT]
```

## Next Steps After Successful Deployment:

1. ✅ Save contract address
2. ✅ Test deposit() function
3. ✅ Test withdraw() when 100% funded
4. ✅ Test repay() function
5. ✅ Test claim() function
6. ✅ Update frontend with contract address
7. 🚀 Deploy to MAINNET (Asset Hub) once tested

## Troubleshooting:

**Error: "Insufficient balance for transaction fee"**
- Get more PAS from faucet
- Need ~1-2 PAS for deployment

**Error: "Contract creation failed"**
- Check you're on Paseo Asset Hub (not Paseo Relay)
- Verify .contract file is correct
- Try refreshing page and reconnecting wallet

**Network Issues:**
- Clear browser cache
- Reconnect wallet
- Try different RPC endpoint

## Gas Costs (Paseo Testnet):
- Deploy: ~0.5 PAS (FREE testnet tokens)
- Operations: ~0.01 PAS each (FREE testnet tokens)

---

**Ready to deploy to Paseo testnet!**
