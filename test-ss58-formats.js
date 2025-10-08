const { createClient } = require('@supabase/supabase-js');
const { Keyring } = require('@polkadot/api');
const { decryptSeed } = require('./src/utils/escrow.js');

const SUPABASE_URL = 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZWh5enZkZmZueHJtdXB3Z3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU5MzA3NSwiZXhwIjoyMDY1MTY5MDc1fQ.xPMyoXxgGk2-cxEiGi7eJpk2j5P5GG2KqNuhtvDezxc';

async function testFormats() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data, error } = await supabase
    .from('projects')
    .select('escrow_seed_encrypted, escrow_wallet_address')
    .eq('id', '397dfb9f-c097-46ba-bea0-67f1e17bc8b0')
    .single();
  
  if (error) {
    console.error('Database error:', error);
    return;
  }
  
  console.log('Target address:', data.escrow_wallet_address);
  console.log('Encrypted seed length:', data.escrow_seed_encrypted.length);
  
  const seed = decryptSeed(data.escrow_seed_encrypted);
  console.log('\nDecrypted seed:', seed);
  
  // Test different SS58 formats
  const formats = [
    { name: 'Generic (42)', ss58: 42 },
    { name: 'Polkadot (0)', ss58: 0 },
    { name: 'Kusama (2)', ss58: 2 }
  ];
  
  for (const format of formats) {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: format.ss58 });
    const baseAccount = keyring.addFromMnemonic(seed);
    const derivedAccount = baseAccount.derive('//1');
    
    console.log(`\n${format.name}:`);
    console.log(`  Base: ${baseAccount.address}`);
    console.log(`  Derived //1: ${derivedAccount.address}`);
    
    if (derivedAccount.address === data.escrow_wallet_address) {
      console.log('  ✅ MATCH FOUND!');
    }
  }
}

testFormats().catch(console.error);
