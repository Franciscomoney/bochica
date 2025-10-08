require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProjectStatus() {
  const projectId = '397dfb9f-c097-46ba-bea0-67f1e17bc8b0';
  
  console.log('🔍 Checking project status...\n');
  
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  console.log('📊 Project Details:');
  console.log('  Title:', project.title);
  console.log('  Status:', project.status);
  console.log('  Goal:', project.goal_amount, 'USDT');
  console.log('  Current Funding:', project.current_funding, 'USDT');
  console.log('  Creator:', project.creator_address);
  console.log('  Escrow Address:', project.escrow_wallet_address);
  console.log('  Withdrawal TX:', project.withdrawal_tx_hash || 'None');
  console.log();
  
  const { data: balance } = await supabase
    .from('project_balances')
    .select('*')
    .eq('project_id', projectId)
    .single();
  
  if (balance) {
    console.log('💰 Balance Details:');
    console.log('  Available:', balance.available_balance, 'USDT');
    console.log('  Withdrawn:', balance.withdrawn_balance, 'USDT');
  }
  
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('project_id', projectId);
  
  console.log('\n📋 Loans:', loans?.length || 0);
  if (loans && loans.length > 0) {
    loans.forEach((loan, i) => {
      console.log(`  Loan ${i + 1}:`, {
        amount: loan.amount,
        status: loan.status,
        blockchain_tx: loan.blockchain_tx
      });
    });
  }
}

checkProjectStatus();
