const { createClient } = require('@supabase/supabase-js');
const { encryptSeed } = require('./src/utils/escrow.js');

// Set the env explicitly
process.env.ESCROW_ENCRYPTION_KEY = 'eb1ffe5ea937846d46855fb5740d6f33';

const SUPABASE_URL = 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZWh5enZkZmZueHJtdXB3Z3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU5MzA3NSwiZXhwIjoyMDY1MTY5MDc1fQ.xPMyoXxgGk2-cxEiGi7eJpk2j5P5GG2KqNuhtvDezxc';

const correctSeed = 'shoot nest corn gym heart monster sad excuse actress auto end copy';
const projectId = '397dfb9f-c097-46ba-bea0-67f1e17bc8b0';

async function fixEncryption() {
  const encrypted = encryptSeed(correctSeed);
  console.log('Newly encrypted seed:', encrypted);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { error } = await supabase
    .from('projects')
    .update({
      escrow_seed_encrypted: encrypted
    })
    .eq('id', projectId);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Database updated with correctly encrypted seed');
  }
}

fixEncryption();
