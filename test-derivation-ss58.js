const { Keyring } = require('@polkadot/api');
const { decryptSeed } = require('./src/utils/escrow.js');

async function testDerivation() {
  const encryptedSeed = 'e18c11cdd0b92b1ec85fb60c6da94c89:8f0ba25bb79ead1e2b6f15afbf83d07c1f36a4a6aadb30a7cee0b40e9e6d7bc58f8c4ccf03e4f45b81f5f66a45d9f11fd4e6fb34969e34cf15a46d4f4d08e2e96265c8f3f18b47e3be77f7f38f3a9e80ee7aaa45f60ad0fd11f3b5e7e93c04cd0fd6f18fdb7a1b13b38be3ff3d7ad85ba';
  
  const seed = decryptSeed(encryptedSeed);
  console.log('Seed:', seed);
  
  // Test with different SS58 formats
  const formats = [
    { name: 'Generic Substrate (42)', ss58: 42 },
    { name: 'Polkadot (0)', ss58: 0 },
    { name: 'Kusama (2)', ss58: 2 },
    { name: 'Asset Hub (0)', ss58: 0 } // Asset Hub uses same as Polkadot
  ];
  
  for (const format of formats) {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: format.ss58 });
    const baseAccount = keyring.addFromMnemonic(seed);
    const derivedAccount = baseAccount.derive('//1');
    
    console.log(`\n${format.name}:`);
    console.log(`  Base: ${baseAccount.address}`);
    console.log(`  Derived //1: ${derivedAccount.address}`);
  }
  
  console.log('\nTarget address: 15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
}

testDerivation().catch(console.error);
