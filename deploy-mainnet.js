const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { ContractPromise } = require('@polkadot/api-contract');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const fs = require('fs');

async function deployContract() {
  try {
    console.log('🔐 Initializing crypto...');
    await cryptoWaitReady();

    console.log('📡 Connecting to Polkadot Asset Hub MAINNET...');
    const wsProvider = new WsProvider('wss://polkadot-asset-hub-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });

    console.log('✅ Connected to Polkadot Asset Hub MAINNET');

    // Create keyring and add account from mnemonic
    const keyring = new Keyring({ type: 'sr25519' });
    const mnemonic = 'shoot nest corn gym heart monster sad excuse actress auto end copy';
    const account = keyring.addFromMnemonic(mnemonic);

    console.log(`👛 Wallet address: ${account.address}`);

    // Check balance
    const { data: balance } = await api.query.system.account(account.address);
    console.log(`💰 Balance: ${balance.free.toHuman()}`);

    // Read contract file from OVH
    const contractPath = '/home/debian/bochica/contracts/bochica_lending_v2/target/ink/bochica_lending_v2.contract';
    console.log(`📄 Reading contract from: ${contractPath}`);

    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found at ${contractPath}`);
    }

    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const wasm = contractJson.source.wasm;
    const abi = contractJson;

    console.log(`📦 Contract WASM size: ${Buffer.from(wasm, 'hex').length} bytes`);

    // Platform wallet parameter
    const platformWallet = '13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy';

    // Gas limit
    const gasLimit = api.registry.createType('WeightV2', {
      refTime: 5000000000000,
      proofSize: 200000
    });

    console.log('📤 Deploying contract to MAINNET...');
    console.log(`⚙️  Constructor parameter (platform_wallet): ${platformWallet}`);

    // Create contract instance
    const contract = new ContractPromise(api, abi, null);

    // Deploy contract
    const tx = contract.tx['new']({ gasLimit, storageDepositLimit: null }, platformWallet);

    // Sign and send
    return new Promise((resolve, reject) => {
      tx.signAndSend(account, ({ status, events, dispatchError }) => {
        console.log(`📊 Status: ${status.type}`);

        if (status.isInBlock) {
          console.log(`⏳ In block: ${status.asInBlock.toHex()}`);
        }

        if (status.isFinalized) {
          console.log(`✅ Finalized: ${status.asFinalized.toHex()}`);

          // Check for errors
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              console.error(`❌ ${decoded.section}.${decoded.name}: ${decoded.docs}`);
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              console.error(`❌ ${dispatchError.toString()}`);
              reject(dispatchError);
            }
          } else {
            // Find Instantiated event
            events.forEach(({ event }) => {
              if (api.events.contracts.Instantiated.is(event)) {
                const [deployer, contractAddress] = event.data;
                console.log('\n🎉 CONTRACT DEPLOYED TO MAINNET!');
                console.log('===========================================');
                console.log(`📍 Contract: ${contractAddress.toString()}`);
                console.log(`👤 Deployer: ${deployer.toString()}`);
                console.log(`🌐 Network: Polkadot Asset Hub (MAINNET)`);
                console.log('===========================================\n');

                // Save
                const info = {
                  contractAddress: contractAddress.toString(),
                  deployer: deployer.toString(),
                  network: 'polkadot-asset-hub',
                  timestamp: new Date().toISOString(),
                  platformWallet: platformWallet,
                  blockHash: status.asFinalized.toHex()
                };

                fs.writeFileSync('/tmp/mainnet-contract.json', JSON.stringify(info, null, 2));
                console.log('💾 Saved to /tmp/mainnet-contract.json');

                resolve(contractAddress.toString());
              }
            });
          }
        }
      });
    });

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

deployContract()
  .then(address => {
    console.log(`\n✅ SUCCESS: ${address}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`\n❌ FAILED: ${error.message}`);
    process.exit(1);
  });
