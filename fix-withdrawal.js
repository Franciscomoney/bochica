const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyFixes() {
  const projectId = '21c83d69-915d-42e7-878f-cda5a5d5161c';
  
  console.log('=== FIX 1: UPDATE PROJECT STATUS TO FUNDED ===');
  const { data: updateData, error: updateError } = await supabase
    .from('projects')
    .update({ status: 'funded' })
    .eq('id', projectId)
    .select();
    
  if (updateError) {
    console.error('Error updating status:', updateError);
  } else {
    console.log('Status updated successfully!');
  }
  
  console.log('\n=== VERIFY STATUS UPDATE ===');
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, title, status, current_funding, goal_amount')
    .eq('id', projectId)
    .single();
    
  if (projectError) {
    console.error('Error fetching project:', projectError);
  } else {
    console.log(projectData);
  }
  
  console.log('\n=== FIX 2: CREATE PROJECT_BALANCE RECORD ===');
  const { data: balanceData, error: balanceError } = await supabase
    .from('project_balances')
    .insert({
      project_id: projectId,
      available_balance: 0.10,
      withdrawn_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();
    
  if (balanceError) {
    console.error('Error creating balance:', balanceError);
  } else {
    console.log('Balance record created successfully!');
  }
  
  console.log('\n=== VERIFY BALANCE RECORD ===');
  const { data: verifyBalance, error: verifyError } = await supabase
    .from('project_balances')
    .select('*')
    .eq('project_id', projectId)
    .single();
    
  if (verifyError) {
    console.error('Error fetching balance:', verifyError);
  } else {
    console.log(verifyBalance);
  }
}

applyFixes().then(() => {
  console.log('\n=== FIXES APPLIED ===');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
