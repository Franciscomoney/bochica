const { createClient } = require('@supabase/supabase-js');
const { encryptSeed } = require('./src/utils/escrow.js');

const SUPABASE_URL = 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZWh5enZkZmZueHJtdXB3Z3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU5MzA3NSwiZXhwIjoyMDY1MTY5MDc1fQ.xPMyoXxgGk2-cxEiGi7eJpk2j5P5GG2KqNuhtvDezxc';

const correctSeed = 'shoot nest corn gym heart monster sad excuse actress auto end copy';
const projectId = '397dfb9f-c097-46ba-bea0-67f1e17bc8b0';

async function updateSeed() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('Encrypting correct seed phrase...');
  const encryptedSeed = encryptSeed(correctSeed);
  console.log('Encrypted seed:', encryptedSeed);
  
  console.log('\nUpdating database...');
  const { error } = await supabase
    .from('projects')
    .update({
      escrow_seed_encrypted: encryptedSeed,
      escrow_wallet_address: '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf'
    })
    .eq('id', projectId);
  
  if (error) {
    console.error('Error updating database:', error);
    return;
  }
  
  console.log('✅ Database updated successfully!');
  
  // Verify
  const { data } = await supabase
    .from('projects')
    .select('escrow_seed_encrypted, escrow_wallet_address')
    .eq('id', projectId)
    .single();
  
  console.log('\nVerified database:');
  console.log('  Wallet:', data.escrow_wallet_address);
  console.log('  Encrypted seed saved:', data.escrow_seed_encrypted.length > 0 ? 'Yes' : 'No');
}

updateSeed().catch(console.error);
