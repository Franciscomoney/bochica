const { createClient } = require('@supabase/supabase-js');
const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady, encodeAddress } = require('@polkadot/util-crypto');
const { decryptSeed } = require('./src/utils/escrow.js');

const SUPABASE_URL = 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZWh5enZkZmZueHJtdXB3Z3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU5MzA3NSwiZXhwIjoyMDY1MTY5MDc1fQ.xPMyoXxgGk2-cxEiGi7eJpk2j5P5GG2KqNuhtvDezxc';

async function verifyWithdrawal() {
  await cryptoWaitReady();
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('🔍 Simulating withdrawal API logic...\n');
  
  // Get project data (same as withdrawal API does)
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', '397dfb9f-c097-46ba-bea0-67f1e17bc8b0')
    .single();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ Project found');
  console.log('   Expected wallet:', project.escrow_wallet_address);
  
  // Decrypt seed (same as withdrawal API)
  console.log('\n🔓 Decrypting seed...');
  const seed = decryptSeed(project.escrow_seed_encrypted);
  console.log('✅ Seed decrypted:', seed);
  
  // Create keyring and derive account (same as withdrawal API)
  console.log('\n🔑 Deriving account with path //1...');
  const keyring = new Keyring({ type: 'sr25519' });
  const baseAccount = keyring.addFromMnemonic(seed);
  const escrowAccount = baseAccount.derive('//1');
  
  // Get Asset Hub format
  const assetHubAddress = encodeAddress(escrowAccount.publicKey, 0);
  
  console.log('   Derived (Generic):', escrowAccount.address);
  console.log('   Derived (Asset Hub):', assetHubAddress);
  
  // Verify (same as withdrawal API)
  if (assetHubAddress === project.escrow_wallet_address) {
    console.log('\n✅✅✅ ADDRESS VERIFICATION PASSED!');
    console.log('🎉 Withdrawal API will work correctly!');
  } else {
    console.log('\n❌ ADDRESS MISMATCH!');
    console.log('   Expected:', project.escrow_wallet_address);
    console.log('   Got:', assetHubAddress);
  }
}

verifyWithdrawal().catch(console.error);
