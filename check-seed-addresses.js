require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Keyring } = require('@polkadot/api');
const { decryptSeed } = require('./src/utils/escrow');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAddresses() {
  const projectId = '397dfb9f-c097-46ba-bea0-67f1e17bc8b0';

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  console.log('Expected address:', '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
  console.log('Database address:', project.escrow_wallet_address);
  console.log('\nDecrypting seed...\n');

  const seed = decryptSeed(project.escrow_seed_encrypted);
  console.log('Seed phrase:', seed);

  console.log('\nGenerating addresses with different types:\n');

  // Try sr25519
  const keyring_sr = new Keyring({ type: 'sr25519' });
  const account_sr = keyring_sr.addFromMnemonic(seed);
  console.log('sr25519:', account_sr.address);

  // Try ed25519
  const keyring_ed = new Keyring({ type: 'ed25519' });
  const account_ed = keyring_ed.addFromMnemonic(seed);
  console.log('ed25519:', account_ed.address);

  // Try ecdsa
  const keyring_ec = new Keyring({ type: 'ecdsa' });
  const account_ec = keyring_ec.addFromMnemonic(seed);
  console.log('ecdsa:', account_ec.address);

  console.log('\nDoes any match 15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf?');
  console.log('sr25519:', account_sr.address === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
  console.log('ed25519:', account_ed.address === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
  console.log('ecdsa:', account_ec.address === '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf');
}

checkAddresses().catch(console.error);
