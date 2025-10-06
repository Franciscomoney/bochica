const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyData() {
  const projectId = '21c83d69-915d-42e7-878f-cda5a5d5161c';
  
  console.log('=== VERIFYING DATABASE UPDATES ===\n');
  
  // Check project with error handling
  console.log('1. Checking project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
    
  if (projectError) {
    console.error('   ❌ Error fetching project:', projectError.message);
    console.log('   Trying to list all projects...');
    const { data: allProjects } = await supabase.from('projects').select('id, title').limit(5);
    console.log('   First 5 projects:', allProjects);
  } else if (project) {
    console.log('   ✅ Project found!');
    console.log('   - Title:', project.title);
    console.log('   - Status:', project.status);
    console.log('   - Current Funding:', project.current_funding);
    console.log('   - Goal Amount:', project.goal_amount);
  }
  
  // Check balance
  console.log('\n2. Checking project balance...');
  const { data: balance, error: balanceError } = await supabase
    .from('project_balances')
    .select('*')
    .eq('project_id', projectId)
    .single();
    
  if (balanceError) {
    console.error('   ❌ Error fetching balance:', balanceError.message);
  } else if (balance) {
    console.log('   ✅ Balance record found!');
    console.log('   - Available Balance:', balance.available_balance);
    console.log('   - Withdrawn Balance:', balance.withdrawn_balance);
    console.log('   - Created At:', balance.created_at);
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  if (project && balance) {
    console.log('✅ Both fixes applied successfully!');
    console.log('✅ Project status:', project.status);
    console.log('✅ Available balance:', balance.available_balance);
    console.log('\nWithdrawal button should now be visible at:');
    console.log('http://localhost:3000/project/' + projectId);
  } else {
    console.log('⚠️ Some data missing - check errors above');
  }
}

verifyData().then(() => process.exit(0)).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
