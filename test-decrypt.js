require('dotenv').config({ path: '.env.local' });
const { getEscrowAccount } = require('./src/utils/escrow');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDecrypt() {
  console.log('🔍 Testing escrow seed decryption...\n');
  
  // First, let's see all columns
  const { data: allProjects, error: listError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', '397dfb9f-c097-46ba-bea0-67f1e17bc8b0')
    .single();
  
  if (listError) {
    console.error('❌ Error fetching project:', listError);
    process.exit(1);
  }
  
  console.log('📊 Project columns and data:');
  console.log(JSON.stringify(allProjects, null, 2));
  console.log();
  
  const encryptedSeed = allProjects.escrow_seed_encrypted;
  
  if (!encryptedSeed) {
    console.error('❌ No encrypted seed found for this project!');
    process.exit(1);
  }
  
  console.log('🔑 Encryption Info:');
  console.log('  Encrypted Seed Length:', encryptedSeed.length);
  console.log('  Encryption Key:', process.env.ESCROW_ENCRYPTION_KEY);
  console.log();
  
  // Try to decrypt
  try {
    console.log('🔓 Attempting to decrypt seed...');
    const account = await getEscrowAccount(encryptedSeed);
    console.log('✅ Decryption successful!');
    console.log('  Decrypted Address:', account.address);
  } catch (error) {
    console.error('❌ Decryption failed!');
    console.error('  Error:', error.message);
    console.log('\n💡 Solution: The encryption key in .env.local does not match');
    console.log('   the key used to encrypt this project.');
    console.log('\n   Next steps:');
    console.log('   1. Create a NEW test project with the current encryption key');
    console.log('   2. Test withdrawal with the new project');
  }
}

testDecrypt().catch(console.error);
