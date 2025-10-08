const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady, encodeAddress } = require('@polkadot/util-crypto');

async function findDerivation() {
  await cryptoWaitReady();
  
  const testSeed = 'portion garbage shadow carry author fork sugar pull symptom calm alien asthma';
  const targetSubstrate = '5GVwsWnw3gQwjbyN98ASKThjinaBocTQjiUVKWVkfxZv8LrX';
  const targetAssetHub = '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf';
  
  console.log('Testing derivation paths...\n');
  console.log('Target (Substrate):', targetSubstrate);
  console.log('Target (Asset Hub):', targetAssetHub);
  console.log();
  
  const keyring42 = new Keyring({ type: 'sr25519', ss58Format: 42 });
  
  // Test different derivation paths
  const paths = ['', '//0', '//1', '//2', '//project', '//escrow'];
  
  for (const path of paths) {
    const account = path 
      ? keyring42.addFromMnemonic(testSeed).derive(path)
      : keyring42.addFromMnemonic(testSeed);
    
    // Get Asset Hub format (prefix 0 for Polkadot)
    const assetHubAddress = encodeAddress(account.publicKey, 0);
    
    console.log(`Path "${path || 'base'}":`);
    console.log(`  Substrate: ${account.address}`);
    console.log(`  Asset Hub: ${assetHubAddress}`);
    
    if (account.address === targetSubstrate) {
      console.log(`  ✅ SUBSTRATE MATCH!`);
    }
    if (assetHubAddress === targetAssetHub) {
      console.log(`  ✅ ASSET HUB MATCH!`);
    }
    console.log();
  }
}

findDerivation().catch(console.error);
