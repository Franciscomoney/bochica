// Test script to debug DOT balance detection
const { ApiPromise, WsProvider } = require("@polkadot/api");

async function testDotBalance() {
  console.log("Connecting to Asset Hub...");
  const provider = new WsProvider("wss://polkadot-asset-hub-rpc.polkadot.io");
  const api = await ApiPromise.create({ provider });

  // Replace with your wallet address
  const address = process.argv[2];
  
  if (!address) {
    console.error("Usage: node test-dot-balance.js <YOUR_WALLET_ADDRESS>");
    process.exit(1);
  }

  console.log(`\nQuerying DOT balance for: ${address}\n`);

  try {
    const account = await api.query.system.account(address);
    
    console.log("Raw account data:", JSON.stringify(account, null, 2));
    console.log("\nParsed data:");
    console.log("- Free balance (raw):", account.data.free.toString());
    console.log("- Reserved:", account.data.reserved.toString());
    console.log("- Frozen:", account.data.frozen ? account.data.frozen.toString() : account.data.miscFrozen.toString());
    
    // Try different decimal conversions
    const free = account.data.free.toString();
    console.log("\nDecimal conversions:");
    console.log("- With 10 decimals (DOT standard):", Number(free) / 1e10);
    console.log("- With 12 decimals (Planck):", Number(free) / 1e12);
    
  } catch (error) {
    console.error("Error:", error.message);
  }

  await api.disconnect();
}

testDotBalance();
