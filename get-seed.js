const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZWh5enZkZmZueHJtdXB3Z3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODcwMTEyMSwiZXhwIjoyMDU0Mjc3MTIxfQ.uLEqYvARcKzgqPV7oe5i93-tJAj5jvdTPGlrHDYy4Og';

async function getSeed() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data, error } = await supabase
    .from('projects')
    .select('escrow_seed_encrypted, escrow_wallet_address')
    .eq('id', '397dfb9f-c097-46ba-bea0-67f1e17bc8b0')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Encrypted seed:', data.escrow_seed_encrypted);
  console.log('Expected address:', data.escrow_wallet_address);
}

getSeed();
