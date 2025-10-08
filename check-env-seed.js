const { Keyring } = require('@polkadot/api');

// Try the seed phrase we know from earlier tests
const testSeed = 'portion garbage shadow carry author fork sugar pull symptom calm alien asthma';

console.log('Testing known seed phrase...\n');

const formats = [
  { name: 'Generic (42)', ss58: 42 },
  { name: 'Polkadot (0)', ss58: 0 },
  { name: 'Kusama (2)', ss58: 2 }
];

for (const format of formats) {
  const keyring = new Keyring({ type: 'sr25519', ss58Format: format.ss58 });
  const baseAccount = keyring.addFromMnemonic(testSeed);
  const derivedAccount = baseAccount.derive('//1');
  
  console.log(`${format.name}:`);
  console.log(`  Base: ${baseAccount.address}`);
  console.log(`  Derived //1: ${derivedAccount.address}`);
  
  if (derivedAccount.address === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf') {
    console.log('  ✅ MATCH FOUND! Use ss58Format:', format.ss58);
  }
  console.log();
}

console.log('Target: 15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
