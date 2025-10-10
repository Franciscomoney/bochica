const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady, encodeAddress } = require('@polkadot/util-crypto');
require('dotenv').config({ path: '.env.local' });

async function checkBalance() {
  const wsProvider = new WsProvider('wss://paseo.rpc.amforc.com');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  const deployer = keyring.addFromMnemonic(process.env.ESCROW_WALLET_SEED);
  const paseoAddress = encodeAddress(deployer.publicKey, 0);
  
  console.log('Address:', paseoAddress);
  console.log('');
  
  const account = await api.query.system.account(paseoAddress);
  console.log('Full account data:', JSON.stringify(account.toJSON(), null, 2));
  console.log('');
  
  const free = account.data.free.toString();
  console.log('Free balance (raw):', free);
  console.log('Free balance / 10^10:', parseFloat(free) / 10**10);
  console.log('Free balance / 10^12:', parseFloat(free) / 10**12);
  
  await api.disconnect();
}

checkBalance().catch(console.error);
