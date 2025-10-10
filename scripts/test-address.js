const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
require('dotenv').config({ path: '.env.local' });

async function testAddress() {
  await cryptoWaitReady();
  
  // Method 1: Set SS58 format first
  const keyring1 = new Keyring({ type: 'sr25519', ss58Format: 42 });
  const root1 = keyring1.addFromMnemonic(process.env.ESCROW_WALLET_SEED);
  const derived1 = root1.derive('//1');
  
  console.log('Method 1 (SS58=42, then derive):');
  console.log('Address:', derived1.address);
  console.log('');
  
  // Method 2: Derive first, then set SS58
  const keyring2 = new Keyring({ type: 'sr25519' });
  const root2 = keyring2.addFromMnemonic(process.env.ESCROW_WALLET_SEED);
  const derived2 = root2.derive('//1');
  derived2.setAddressFormat(42);
  
  console.log('Method 2 (derive, then SS58=42):');
  console.log('Address:', derived2.address);
  console.log('');
  
  console.log('Expected: 13sFJrSj46LoiJpdpDjk5RH5oPbDmuAqhYLbigL5tuYiok8n');
}

testAddress().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
