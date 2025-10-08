require('dotenv').config({ path: '.env.local' });

async function testWithdrawal() {
  const projectId = '397dfb9f-c097-46ba-bea0-67f1e17bc8b0';
  const creatorAddress = '5EvxAXBfCK5LGmp7ragjwGSvwmba5bchd3c7ZPLjLpXCdFDx';
  
  console.log('🧪 Testing withdrawal endpoint...\n');
  console.log('Project ID:', projectId);
  console.log('Creator Address:', creatorAddress);
  console.log();
  
  try {
    const response = await fetch('https://localhost:8100/api/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, creatorAddress }),
      // Ignore self-signed certificate
      agent: new (require('https')).Agent({ rejectUnauthorized: false })
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ Withdrawal successful!');
      console.log('Transaction Hash:', data.txHash);
      console.log('Creator Amount:', data.creatorAmount, 'USDT');
      console.log('Platform Fee:', data.platformFeeAmount, 'USDT');
    } else {
      console.log('\n❌ Withdrawal failed!');
      console.log('Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithdrawal();
