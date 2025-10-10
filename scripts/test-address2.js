const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady, encodeAddress } = require('@polkadot/util-crypto');
require('dotenv').config({ path: '.env.local' });

async function testAddress() {
  await cryptoWaitReady();
  
  const keyring = new Keyring({ type: 'sr25519' });
  const root = keyring.addFromMnemonic(process.env.ESCROW_WALLET_SEED);
  const derived = root.derive('//1');
  
  console.log('Default address:', derived.address);
  console.log('Public Key:', derived.publicKey);
  console.log('');
  
  // Encode with SS58 format 42 (Substrate)
  const paseoAddress = encodeAddress(derived.publicKey, 42);
  console.log('Paseo address (SS58=42):', paseoAddress);
  console.log('Expected:                 13sFJrSj46LoiJpdpDjk5RH5oPbDmuAqhYLbigL5tuYiok8n');
}

testAddress().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
