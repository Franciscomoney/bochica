const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testWithdrawalButton() {
  const projectId = '21c83d69-915d-42e7-878f-cda5a5d5161c';
  
  console.log('=== CHECKING CONDITIONS FOR WITHDRAWAL BUTTON ===\n');
  
  // 1. Check project status
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, status, current_funding, goal_amount, entrepreneur_wallet')
    .eq('id', projectId)
    .single();
    
  console.log('1. Project Status Check:');
  console.log('   Status:', project.status);
  console.log('   Current Funding:', project.current_funding);
  console.log('   Goal Amount:', project.goal_amount);
  console.log('   Entrepreneur Wallet:', project.entrepreneur_wallet);
  console.log('   ✅ Status is funded?', project.status === 'funded' ? 'YES' : 'NO');
  
  // 2. Check project balance
  const { data: balance } = await supabase
    .from('project_balances')
    .select('*')
    .eq('project_id', projectId)
    .single();
    
  console.log('\n2. Project Balance Check:');
  console.log('   Available Balance:', balance.available_balance);
  console.log('   Withdrawn Balance:', balance.withdrawn_balance);
  console.log('   ✅ Balance exists?', balance ? 'YES' : 'NO');
  console.log('   ✅ Available balance > 0?', balance.available_balance > 0 ? 'YES' : 'NO');
  
  // 3. Final verdict
  const shouldShowButton = 
    project.status === 'funded' && 
    balance && 
    balance.available_balance > 0;
    
  console.log('\n=== FINAL VERDICT ===');
  console.log('   Withdrawal button should be visible?', shouldShowButton ? '✅ YES' : '❌ NO');
  
  if (shouldShowButton) {
    console.log('\n✅ ALL CONDITIONS MET! Withdrawal button should now appear.');
    console.log('   View project at: http://localhost:3000/project/' + projectId);
  }
}

testWithdrawalButton().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
