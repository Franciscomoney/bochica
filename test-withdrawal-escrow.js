require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { getEscrowAccount } = require('./src/utils/escrow');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const projectId = '397dfb9f-c097-46ba-bea0-67f1e17bc8b0';

  console.log('Fetching project from database...');
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return;
  }

  console.log('\n=== PROJECT DATA ===');
  console.log('Project ID:', project.id);
  console.log('Project escrow address:', project.escrow_wallet_address);
  console.log('Expected:', '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
  console.log('Match:', project.escrow_wallet_address === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');

  console.log('\n=== DECRYPTING SEED ===');
  try {
    const account = await getEscrowAccount(project.escrow_seed_encrypted);
    console.log('Decrypted address:', account.address);
    console.log('Match with expected:', account.address === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
    console.log('Match with DB:', account.address === project.escrow_wallet_address);

    console.log('\n=== RESULT ===');
    if (account.address === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf') {
      console.log('✅ SUCCESS: Escrow wallet is correctly loaded');
    } else {
      console.log('❌ FAILURE: Address mismatch');
    }
  } catch (err) {
    console.error('Error decrypting escrow seed:', err);
  }
}

test()
  .catch(console.error)
  .finally(() => process.exit(0));
