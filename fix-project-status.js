const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZWh5enZkZmZueHJtdXB3Z3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU5MzA3NSwiZXhwIjoyMDY1MTY5MDc1fQ.xPMyoXxgGk2-cxEiGi7eJpk2j5P5GG2KqNuhtvDezxc';

async function fix() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { error } = await supabase
    .from('projects')
    .update({
      status: 'withdrawn',
      withdrawal_tx_hash: '0x79b878103d60a495bb551fc03851372c27b741a986f4c64c7f9ce801b1eedda1',
      withdrawal_date: new Date().toISOString(),
      platform_fee_paid: 0
    })
    .eq('id', '397dfb9f-c097-46ba-bea0-67f1e17bc8b0');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Project status updated to withdrawn');
  }
}

fix();
