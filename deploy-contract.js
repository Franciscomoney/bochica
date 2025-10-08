const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { ContractPromise } = require('@polkadot/api-contract');
const { mnemonicToMiniSecret, cryptoWaitReady } = require('@polkadot/util-crypto');
const fs = require('fs');

async function deployContract() {
  try {
    console.log('🔐 Initializing crypto...');
    await cryptoWaitReady();

    console.log('📡 Connecting to Paseo Asset Hub...');
    const wsProvider = new WsProvider('wss://paseo-asset-hub-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });

    console.log('✅ Connected to Paseo Asset Hub');

    // Create keyring and add account from mnemonic
    const keyring = new Keyring({ type: 'sr25519' });
    const mnemonic = 'shoot nest corn gym heart monster sad excuse actress auto end copy';
    const account = keyring.addFromMnemonic(mnemonic);

    console.log(`👛 Wallet address: ${account.address}`);

    // Read contract file
    const contractPath = '/home/debian/bochica/contracts/bochica_lending_v2/target/ink/bochica_lending_v2.contract';
    console.log(`📄 Reading contract from: ${contractPath}`);

    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const wasm = contractJson.source.wasm;
    const abi = contractJson;

    console.log(`📦 Contract size: ${Buffer.from(wasm, 'hex').length} bytes`);

    // Platform wallet parameter
    const platformWallet = '13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy';

    // Gas limit
    const gasLimit = api.registry.createType('WeightV2', {
      refTime: 3000000000000,
      proofSize: 131072
    });

    console.log('📤 Uploading and instantiating contract...');
    console.log(`⚙️  Constructor parameter: ${platformWallet}`);

    // Create contract instance
    const contract = new ContractPromise(api, abi, null);

    // Deploy contract
    const tx = contract.tx['new']({ gasLimit, storageDepositLimit: null }, platformWallet);

    // Sign and send
    return new Promise((resolve, reject) => {
      tx.signAndSend(account, ({ status, events, dispatchError }) => {
        console.log(`📊 Transaction status: ${status.type}`);

        if (status.isInBlock) {
          console.log(`⏳ In block: ${status.asInBlock.toHex()}`);
        }

        if (status.isFinalized) {
          console.log(`✅ Finalized in block: ${status.asFinalized.toHex()}`);

          // Check for errors
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              console.error(`❌ Error: ${decoded.section}.${decoded.name}: ${decoded.docs}`);
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              console.error(`❌ Error: ${dispatchError.toString()}`);
              reject(dispatchError);
            }
          } else {
            // Find contract instantiation event
            events.forEach(({ event }) => {
              if (api.events.contracts.Instantiated.is(event)) {
                const [deployer, contractAddress] = event.data;
                console.log('\n🎉 CONTRACT DEPLOYED SUCCESSFULLY!');
                console.log('===========================================');
                console.log(`📍 Contract Address: ${contractAddress.toString()}`);
                console.log(`👤 Deployer: ${deployer.toString()}`);
                console.log('===========================================\n');

                // Save to file
                const deploymentInfo = {
                  contractAddress: contractAddress.toString(),
                  deployer: deployer.toString(),
                  network: 'paseo',
                  timestamp: new Date().toISOString(),
                  platformWallet: platformWallet
                };

                fs.writeFileSync('/tmp/deployed-contract.json', JSON.stringify(deploymentInfo, null, 2));
                console.log('💾 Deployment info saved to /tmp/deployed-contract.json');

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
    console.log('\n✅ Deployment completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });
