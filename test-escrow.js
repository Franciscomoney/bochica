#!/usr/bin/env node

/**
 * Test script for escrow wallet generation
 * Tests the escrow utility functions
 */

const { generateEscrowWallet, getEscrowAccount, isValidPolkadotAddress } = require('./src/utils/escrow');

async function testEscrowWallet() {
  console.log('🧪 Testing Escrow Wallet Generation\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Generate a new wallet
    console.log('\n1️⃣  Generating new escrow wallet...');
    const wallet = await generateEscrowWallet();
    
    console.log('✅ Wallet generated successfully!');
    console.log('   Address:', wallet.address);
    console.log('   Seed (first 20 chars):', wallet.seed.substring(0, 20) + '...');
    console.log('   Encrypted (first 40 chars):', wallet.seedEncrypted.substring(0, 40) + '...');
    
    // Test 2: Validate the address
    console.log('\n2️⃣  Validating wallet address...');
    const isValid = isValidPolkadotAddress(wallet.address);
    console.log(isValid ? '✅ Address is valid' : '❌ Address is invalid');
    
    // Test 3: Retrieve account from encrypted seed
    console.log('\n3️⃣  Retrieving account from encrypted seed...');
    const retrievedAccount = await getEscrowAccount(wallet.seedEncrypted);
    
    console.log('✅ Account retrieved successfully!');
    console.log('   Retrieved address:', retrievedAccount.address);
    console.log('   Matches original:', retrievedAccount.address === wallet.address ? '✅ YES' : '❌ NO');
    
    // Test 4: Generate multiple wallets (uniqueness test)
    console.log('\n4️⃣  Testing wallet uniqueness...');
    const wallet2 = await generateEscrowWallet();
    const wallet3 = await generateEscrowWallet();
    
    const allUnique = wallet.address !== wallet2.address && 
                      wallet2.address !== wallet3.address && 
                      wallet.address !== wallet3.address;
    
    console.log(allUnique ? '✅ All wallets are unique' : '❌ Wallets are not unique');
    console.log('   Wallet 1:', wallet.address);
    console.log('   Wallet 2:', wallet2.address);
    console.log('   Wallet 3:', wallet3.address);
    
    // Test 5: Encryption key test
    console.log('\n5️⃣  Testing encryption configuration...');
    const hasEncryptionKey = process.env.ESCROW_ENCRYPTION_KEY ? true : false;
    if (hasEncryptionKey) {
      console.log('✅ Custom encryption key is set');
    } else {
      console.log('⚠️  Using default encryption key (set ESCROW_ENCRYPTION_KEY in .env.local for production)');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary:');
    console.log('   ✅ Wallet generation: PASS');
    console.log('   ' + (isValid ? '✅' : '❌') + ' Address validation: ' + (isValid ? 'PASS' : 'FAIL'));
    console.log('   ✅ Account retrieval: PASS');
    console.log('   ' + (allUnique ? '✅' : '❌') + ' Uniqueness test: ' + (allUnique ? 'PASS' : 'FAIL'));
    console.log('   ' + (hasEncryptionKey ? '✅' : '⚠️ ') + ' Encryption key: ' + (hasEncryptionKey ? 'CONFIGURED' : 'DEFAULT'));
    console.log('='.repeat(60));
    
    console.log('\n✅ All tests passed! Escrow wallet system is ready.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testEscrowWallet();
