const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady, encodeAddress } = require('@polkadot/util-crypto');
require('dotenv').config({ path: '.env.local' });

const PASEO_ENDPOINTS = [
  'wss://paseo.rpc.amforc.com',
  'wss://paseo-rpc.dwellir.com',
  'wss://rpc.ibp.network/paseo',
  'wss://paseo.dotters.network'
];

async function checkBalance(endpoint) {
  try {
    console.log(`\n🔍 Checking ${endpoint}...`);
    const wsProvider = new WsProvider(endpoint, 5000);
    const api = await ApiPromise.create({ provider: wsProvider });
    
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const deployer = keyring.addFromMnemonic(process.env.ESCROW_WALLET_SEED);
    const paseoAddress = encodeAddress(deployer.publicKey, 0);
    
    console.log('Chain:', (await api.rpc.system.chain()).toString());
    
    const account = await api.query.system.account(paseoAddress);
    const free = account.data.free.toString();
    const balance = parseFloat(free) / 10**10;
    
    console.log('Balance:', balance.toFixed(4), 'PAS');
    
    if (balance > 0) {
      console.log('✅ FOUND TOKENS HERE!');
      return { endpoint, balance };
    }
    
    await api.disconnect();
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
}

async function checkAll() {
  for (const endpoint of PASEO_ENDPOINTS) {
    await checkBalance(endpoint);
  }
}

checkAll().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
