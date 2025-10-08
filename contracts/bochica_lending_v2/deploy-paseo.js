const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { CodePromise } = require('@polkadot/api-contract');
const fs = require('fs');

async function deploy() {
    console.log('🚀 Deploying Bochica Lending Contract to Paseo Asset Hub...\n');

    // Connect to Paseo Asset Hub
    const wsProvider = new WsProvider('wss://paseo-asset-hub-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });
    
    console.log('✅ Connected to Paseo Asset Hub');
    console.log(`   Chain: ${await api.rpc.system.chain()}`);
    console.log(`   Version: ${await api.rpc.system.version()}\n`);

    // Load contract metadata and WASM
    const contractFile = './target/ink/bochica_lending_v2.contract';
    const contractData = JSON.parse(fs.readFileSync(contractFile, 'utf8'));
    const wasm = contractData.source.wasm;
    const metadata = contractData;

    console.log('✅ Contract file verified and ready');
    console.log(`   File: ${contractFile}`);
    console.log(`   WASM Size: ${Buffer.from(wasm, 'hex').length / 1024} KB\n`);

    console.log('⚠️  AUTOMATED DEPLOYMENT REQUIRES WALLET SEED PHRASE');
    console.log('   For security, please deploy manually via Polkadot.js Apps UI\n');
    
    console.log('📋 Manual Deployment Instructions:');
    console.log('   1. Go to: https://polkadot.js.org/apps/?rpc=wss://paseo-asset-hub-rpc.polkadot.io#/contracts');
    console.log('   2. Click "Upload & deploy code"');
    console.log('   3. Upload: bochica_lending_v2.contract');
    console.log('   4. Constructor parameter:');
    console.log('      platform_wallet: 13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy');
    console.log('   5. Click Deploy and sign with your wallet\n');

    await api.disconnect();
}

deploy().catch(console.error);
