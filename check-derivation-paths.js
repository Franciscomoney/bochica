const { createClient } = require('@supabase/supabase-js');
const { Keyring } = require('@polkadot/api');
const { decryptSeed } = require('./src/utils/escrow');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDerivationPaths() {
  const projectId = '397dfb9f-c097-46ba-bea0-67f1e17bc8b0';
  const targetAddress = '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf';
  
  const { data: project } = await supabase
    .from('projects')
    .select('escrow_seed_encrypted')
    .eq('id', projectId)
    .single();
  
  const seed = decryptSeed(project.escrow_seed_encrypted);
  console.log('Target address:', targetAddress);
  console.log('\nChecking derivation paths...\n');
  
  const keyring = new Keyring({ type: 'sr25519' });
  
  // Check first 20 derivation paths
  for (let i = 0; i < 20; i++) {
    const account = keyring.addFromMnemonic(seed, {}, 'sr25519');
    const derived = account.derive(`//polkadot//${i}`);
    console.log(`//polkadot//${i}:`, derived.address);
    
    if (derived.address === targetAddress) {
      console.log('\n✅ FOUND IT! Derivation path:', `//polkadot//${i}`);
      return;
    }
  }
  
  // Try simple paths
  for (let i = 0; i < 20; i++) {
    const account = keyring.addFromMnemonic(`${seed}//${i}`);
    console.log(`//${i}:`, account.address);
    
    if (account.address === targetAddress) {
      console.log('\n✅ FOUND IT! Derivation path:', `//${i}`);
      return;
    }
  }
  
  console.log('\n❌ Not found in first 20 derivation paths');
}

checkDerivationPaths().catch(console.error);
