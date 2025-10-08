#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const { generateEscrowWallet, getEscrowAccount, isValidPolkadotAddress } = require('./src/utils/escrow');

async function testEscrowWallet() {
  console.log('🧪 Testing Escrow Wallet Generation (with .env.local)\n');
  console.log('='.repeat(60));
  
  // Show encryption key status
  const hasCustomKey = process.env.ESCROW_ENCRYPTION_KEY && 
                       process.env.ESCROW_ENCRYPTION_KEY !== 'change-this-in-production-32-chars!!';
  console.log('\n🔑 Encryption Key Status:');
  console.log('   Custom key configured:', hasCustomKey ? '✅ YES' : '❌ NO (using default)');
  if (hasCustomKey) {
    console.log('   Key (first 10 chars):', process.env.ESCROW_ENCRYPTION_KEY.substring(0, 10) + '...');
  }
  
  try {
    // Test 1: Generate a new wallet
    console.log('\n1️⃣  Generating new escrow wallet...');
    const wallet = await generateEscrowWallet();
    
    console.log('✅ Wallet generated successfully!');
    console.log('   Address:', wallet.address);
    console.log('   Seed (first 20 chars):', wallet.seed.substring(0, 20) + '...');
    console.log('   Encrypted (first 40 chars):', wallet.encryptedSeed.substring(0, 40) + '...');
    
    // Test 2: Validate address
    console.log('\n2️⃣  Validating wallet address...');
    const isValid = isValidPolkadotAddress(wallet.address);
    if (!isValid) {
      throw new Error('Generated address is invalid!');
    }
    console.log('✅ Address is valid');
    
    // Test 3: Retrieve account from encrypted seed
    console.log('\n3️⃣  Retrieving account from encrypted seed...');
    const retrievedAccount = await getEscrowAccount(wallet.encryptedSeed);
    console.log('✅ Account retrieved successfully!');
    console.log('   Retrieved address:', retrievedAccount.address);
    console.log('   Matches original:', retrievedAccount.address === wallet.address ? '✅ YES' : '❌ NO');
    
    if (retrievedAccount.address !== wallet.address) {
      throw new Error('Address mismatch! Encryption/decryption failed.');
    }
    
    console.log('\n='.repeat(60));
    console.log('✅ All tests passed! Escrow wallet system is ready.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testEscrowWallet();
