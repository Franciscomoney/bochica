const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fvehyzvdffnxrmupwgtv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZWh5enZkZmZueHJtdXB3Z3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU5MzA3NSwiZXhwIjoyMDY1MTY5MDc1fQ.xPMyoXxgGk2-cxEiGi7eJpk2j5P5GG2KqNuhtvDezxc';

async function check() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', '397dfb9f-c097-46ba-bea0-67f1e17bc8b0')
    .single();
  
  console.log(JSON.stringify(data, null, 2));
}

check();
