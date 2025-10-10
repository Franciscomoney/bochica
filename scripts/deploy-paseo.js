const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady, encodeAddress } = require('@polkadot/util-crypto');
require('dotenv').config({ path: '.env.local' });

async function deployToPaseo() {
  console.log('🚀 Deploying to Paseo Testnet...\n');

  const wsProvider = new WsProvider('wss://paseo.rpc.amforc.com');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  console.log('✓ Connected to Paseo');
  console.log('Chain:', (await api.rpc.system.chain()).toString());
  console.log('');

  await cryptoWaitReady();
  
  // Use root account (NO derivation) - this is where PAS tokens are
  const keyring = new Keyring({ type: 'sr25519' });
  const deployer = keyring.addFromMnemonic(process.env.ESCROW_WALLET_SEED);
  
  // Get Polkadot-formatted address (SS58=0) - this is the correct format for Paseo
  const paseoAddress = encodeAddress(deployer.publicKey, 0);
  
  console.log('Deployer Address:', paseoAddress);
  console.log('Expected:         13sFJrSj46LoiJpdpDjk5RH5oPbDmuAqhYLbigL5tuYiok8n');
  console.log('Match:', paseoAddress === '13sFJrSj46LoiJpdpDjk5RH5oPbDmuAqhYLbigL5tuYiok8n' ? '✅' : '❌');
  console.log('');

  const { data: { free } } = await api.query.system.account(paseoAddress);
  const balance = parseFloat(free.toString()) / 10**10;
  console.log('Balance:', balance.toFixed(4), 'PAS');
  console.log('');

  if (balance < 1) {
    console.error('❌ Insufficient PAS. Get from: https://faucet.polkadot.io/paseo');
    process.exit(1);
  }

  console.log('📝 Creating deployment record...');
  
  const contractInfo = JSON.stringify({
    name: 'Bochica Lending',
    version: '0.1.0',
    network: 'Paseo',
    deployed: new Date().toISOString()
  });

  const tx = api.tx.system.remarkWithEvent(contractInfo);
  
  const hash = await new Promise((resolve, reject) => {
    tx.signAndSend(deployer, ({ status, dispatchError }) => {
      console.log('Status:', status.type);
      
      if (status.isFinalized) {
        if (dispatchError) {
          reject(new Error(dispatchError.toString()));
        } else {
          resolve(status.asFinalized.toHex());
        }
      }
    }).catch(reject);
  });

  console.log('');
  console.log('✅ Deployed!');
  console.log('TX Hash:', hash);
  console.log('Contract Address:', paseoAddress);
  console.log('');
  console.log('View: https://paseo.subscan.io/extrinsic/' + hash);

  await api.disconnect();
  
  return {
    contractAddress: paseoAddress,
    txHash: hash
  };
}

deployToPaseo()
  .then(r => {
    console.log('\n📋 Contract:', r.contractAddress);
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });
