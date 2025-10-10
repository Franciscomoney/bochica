const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady, encodeAddress } = require('@polkadot/util-crypto');
require('dotenv').config({ path: '.env.local' });

async function verifyWallets() {
  await cryptoWaitReady();
  
  const keyring = new Keyring({ type: 'sr25519' });
  const root = keyring.addFromMnemonic(process.env.ESCROW_WALLET_SEED);
  
  const wallet0 = root.derive('//0');
  const wallet1 = root.derive('//1');
  
  // Get addresses in Polkadot format (SS58=0)
  const addr0 = encodeAddress(wallet0.publicKey, 0);
  const addr1 = encodeAddress(wallet1.publicKey, 0);
  
  console.log('Platform Fee Wallet (//0):', addr0);
  console.log('Expected:                  13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy');
  console.log('Match:', addr0 === '13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy' ? '✅' : '❌');
  console.log('');
  console.log('Escrow Wallet (//1):       ', addr1);
  console.log('Expected:                  15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
  console.log('Match:', addr1 === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf' ? '✅' : '❌');
}

verifyWallets().catch(console.error);
