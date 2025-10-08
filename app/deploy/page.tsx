'use client';

import { useEffect } from 'react';

export default function DeployPage() {
  useEffect(() => {
    // Client-side only scripts will be loaded here
    const loadScripts = async () => {
      // Scripts are loaded via CDN in the component below
    };
    loadScripts();
  }, []);

  return (
    <>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@polkadot/api@10.13.1/bundle-polkadot-api.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@polkadot/extension-dapp@0.46.9/bundle-polkadot-extension-dapp.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@polkadot/util-crypto@12.6.2/bundle-polkadot-util-crypto.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@polkadot/util@12.6.2/bundle-polkadot-util.min.js"></script>
      </head>
      <div dangerouslySetInnerHTML={{ __html: deployPageHTML }} />
    </>
  );
}

const deployPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bochica Smart Contract Deployment</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }

        .section {
            margin-bottom: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }

        .section h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 20px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 12px;
            margin-bottom: 15px;
        }

        .info-label {
            font-weight: 600;
            color: #555;
        }

        .info-value {
            color: #333;
            word-break: break-all;
        }

        .status {
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-weight: 600;
            font-size: 14px;
        }

        .status.disconnected {
            background: #fee;
            color: #c33;
        }

        .status.connected {
            background: #efe;
            color: #3c3;
        }

        .status.deploying {
            background: #ffc;
            color: #cc6;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .button-group {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }

        input[type="text"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            margin-top: 10px;
            font-family: monospace;
        }

        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }

        .log {
            background: #1e1e1e;
            color: #33ff33;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 20px;
        }

        .log-entry {
            margin-bottom: 8px;
            line-height: 1.5;
        }

        .log-entry.error {
            color: #ff6b6b;
        }

        .log-entry.success {
            color: #51cf66;
        }

        .log-entry.info {
            color: #74c0fc;
        }

        .contract-address {
            background: #e7f5ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border: 2px solid #339af0;
        }

        .contract-address h3 {
            color: #1864ab;
            margin-bottom: 10px;
        }

        .contract-address code {
            background: white;
            padding: 12px;
            border-radius: 6px;
            display: block;
            font-size: 14px;
            word-break: break-all;
            color: #1864ab;
            font-weight: 600;
        }

        .alert {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            color: #856404;
        }

        .alert strong {
            display: block;
            margin-bottom: 5px;
        }

        .file-input {
            margin-top: 10px;
            padding: 10px;
            border: 2px dashed #667eea;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            background: #f8f9fa;
        }

        .file-input:hover {
            background: #e9ecef;
        }

        input[type="file"] {
            display: none;
        }

        .file-name {
            color: #667eea;
            font-weight: 600;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Bochica Smart Contract Deployment</h1>
        <p class="subtitle">Deploy to Paseo Asset Hub Testnet</p>

        <div class="alert">
            <strong>⚠️ Important:</strong>
            Make sure you have the compiled .contract file ready and your Talisman/Polkadot.js wallet extension installed.
        </div>

        <!-- Network Status -->
        <div class="section">
            <h2>📡 Network Status</h2>
            <div class="info-grid">
                <div class="info-label">Network:</div>
                <div class="info-value">Paseo Asset Hub</div>
                <div class="info-label">RPC Endpoint:</div>
                <div class="info-value">wss://paseo-asset-hub-rpc.polkadot.io</div>
                <div class="info-label">Status:</div>
                <div class="info-value"><span id="networkStatus" class="status disconnected">Disconnected</span></div>
            </div>
        </div>

        <!-- Wallet Connection -->
        <div class="section">
            <h2>👛 Wallet Connection</h2>
            <div class="info-grid">
                <div class="info-label">Wallet:</div>
                <div class="info-value"><span id="walletStatus">Not connected</span></div>
                <div class="info-label">Address:</div>
                <div class="info-value"><span id="walletAddress">-</span></div>
                <div class="info-label">Balance:</div>
                <div class="info-value"><span id="walletBalance">-</span></div>
            </div>
            <button id="connectWallet" onclick="connectWallet()">Connect Wallet</button>
        </div>

        <!-- Contract Upload -->
        <div class="section">
            <h2>📄 Contract File</h2>
            <div class="file-input" onclick="document.getElementById('contractFile').click()">
                <div>📁 Click to select .contract file</div>
                <div class="file-name" id="fileName">No file selected</div>
            </div>
            <input type="file" id="contractFile" accept=".contract" onchange="handleFileSelect(event)">
        </div>

        <!-- Constructor Parameters -->
        <div class="section">
            <h2>⚙️ Constructor Parameters</h2>
            <div class="info-grid">
                <div class="info-label">platform_wallet:</div>
                <div class="info-value">
                    <input type="text" id="platformWallet" value="13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy" readonly>
                </div>
            </div>
        </div>

        <!-- Deploy Button -->
        <div class="section">
            <h2>🚀 Deployment</h2>
            <div class="button-group">
                <button id="deployButton" onclick="deployContract()" disabled>Deploy Contract</button>
                <button onclick="location.href='/project'">View Tasks</button>
            </div>
        </div>

        <!-- Deployment Log -->
        <div id="logContainer" style="display: none;">
            <div class="section">
                <h2>📋 Deployment Log</h2>
                <div id="deploymentLog" class="log"></div>
            </div>
        </div>

        <!-- Contract Address Display -->
        <div id="contractAddressContainer" style="display: none;">
            <div class="contract-address">
                <h3>✅ Contract Deployed Successfully!</h3>
                <p style="margin-bottom: 10px;">Contract Address:</p>
                <code id="deployedAddress"></code>
            </div>
        </div>
    </div>

    <script>
        let api;
        let contractFile;
        let selectedAccount;

        // Initialize on page load
        window.onload = async () => {
            await connectToNetwork();
        };

        // Connect to Paseo Asset Hub
        async function connectToNetwork() {
            addLog('Connecting to Paseo Asset Hub...', 'info');

            try {
                const { ApiPromise, WsProvider } = polkadotApi;
                const provider = new WsProvider('wss://paseo-asset-hub-rpc.polkadot.io');

                api = await ApiPromise.create({ provider });

                document.getElementById('networkStatus').className = 'status connected';
                document.getElementById('networkStatus').textContent = 'Connected';

                addLog('✅ Connected to Paseo Asset Hub', 'success');
            } catch (error) {
                addLog('❌ Failed to connect: ' + error.message, 'error');
                document.getElementById('networkStatus').className = 'status disconnected';
                document.getElementById('networkStatus').textContent = 'Connection Failed';
            }
        }

        // Connect wallet
        async function connectWallet() {
            addLog('Requesting wallet connection...', 'info');

            try {
                const { web3Accounts, web3Enable, web3FromAddress } = polkadotExtensionDapp;

                // Enable extension
                const extensions = await web3Enable('Bochica Deployment');

                if (extensions.length === 0) {
                    throw new Error('No wallet extension found. Please install Talisman or Polkadot.js extension.');
                }

                // Get accounts
                const accounts = await web3Accounts();

                if (accounts.length === 0) {
                    throw new Error('No accounts found. Please create an account in your wallet.');
                }

                // Use first account
                selectedAccount = accounts[0];

                // Get balance
                const { data: balance } = await api.query.system.account(selectedAccount.address);
                const freeBalance = balance.free.toHuman();

                document.getElementById('walletStatus').textContent = selectedAccount.meta.name || 'Connected';
                document.getElementById('walletAddress').textContent = selectedAccount.address;
                document.getElementById('walletBalance').textContent = freeBalance + ' PAS';

                addLog(\`✅ Connected: \${selectedAccount.address}\`, 'success');
                addLog(\`💰 Balance: \${freeBalance} PAS\`, 'info');

                checkDeployReady();
            } catch (error) {
                addLog('❌ Wallet connection failed: ' + error.message, 'error');
            }
        }

        // Handle file selection
        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                if (!file.name.endsWith('.contract')) {
                    addLog('❌ Please select a .contract file', 'error');
                    return;
                }

                contractFile = file;
                document.getElementById('fileName').textContent = file.name;
                addLog(\`📄 Contract file loaded: \${file.name}\`, 'success');

                checkDeployReady();
            }
        }

        // Check if ready to deploy
        function checkDeployReady() {
            const ready = api && selectedAccount && contractFile;
            document.getElementById('deployButton').disabled = !ready;

            if (ready) {
                addLog('✅ Ready to deploy!', 'success');
            }
        }

        // Deploy contract
        async function deployContract() {
            document.getElementById('logContainer').style.display = 'block';
            document.getElementById('deployButton').disabled = true;
            document.getElementById('deployButton').textContent = 'Deploying...';

            addLog('🚀 Starting deployment...', 'info');

            try {
                // Read contract file
                const fileContent = await contractFile.arrayBuffer();
                const wasm = new Uint8Array(fileContent);

                addLog('📦 Contract file loaded (' + (wasm.length / 1024).toFixed(2) + ' KB)', 'info');

                // Parse contract metadata
                const { Abi } = polkadotApi;
                const contractData = JSON.parse(new TextDecoder().decode(wasm));
                const abi = new Abi(contractData);

                addLog('📋 Contract ABI parsed', 'success');

                // Get platform wallet parameter
                const platformWallet = document.getElementById('platformWallet').value;

                addLog('⚙️ Constructor parameter: ' + platformWallet, 'info');

                // Create code hash
                const { web3FromAddress } = polkadotExtensionDapp;
                const injector = await web3FromAddress(selectedAccount.address);

                // Upload code
                addLog('📤 Uploading contract code...', 'info');

                const codeHash = await new Promise((resolve, reject) => {
                    api.tx.contracts
                        .uploadCode(contractData.source.wasm, null, 'Deterministic')
                        .signAndSend(selectedAccount.address, { signer: injector.signer }, ({ status, events }) => {
                            if (status.isInBlock) {
                                addLog('⏳ Code uploaded in block: ' + status.asInBlock.toHex(), 'info');
                            } else if (status.isFinalized) {
                                const codeHashEvent = events.find(({ event }) =>
                                    api.events.contracts.CodeStored.is(event)
                                );

                                if (codeHashEvent) {
                                    resolve(codeHashEvent.event.data[0].toHex());
                                } else {
                                    reject(new Error('Code storage failed'));
                                }
                            }
                        })
                        .catch(reject);
                });

                addLog('✅ Code uploaded: ' + codeHash, 'success');

                // Instantiate contract
                addLog('🏗️ Instantiating contract...', 'info');

                const gasLimit = api.registry.createType('WeightV2', {
                    refTime: 3000000000,
                    proofSize: 131072
                });

                const storageDepositLimit = null;

                const contractAddress = await new Promise((resolve, reject) => {
                    api.tx.contracts
                        .instantiate(
                            0, // value
                            gasLimit,
                            storageDepositLimit,
                            codeHash,
                            abi.constructors[0].toU8a([platformWallet])
                        )
                        .signAndSend(selectedAccount.address, { signer: injector.signer }, ({ status, events }) => {
                            if (status.isInBlock) {
                                addLog('⏳ Contract instantiated in block: ' + status.asInBlock.toHex(), 'info');
                            } else if (status.isFinalized) {
                                const instantiateEvent = events.find(({ event }) =>
                                    api.events.contracts.Instantiated.is(event)
                                );

                                if (instantiateEvent) {
                                    resolve(instantiateEvent.event.data[1].toString());
                                } else {
                                    reject(new Error('Contract instantiation failed'));
                                }
                            }
                        })
                        .catch(reject);
                });

                addLog('✅ Contract deployed!', 'success');
                addLog('📍 Contract address: ' + contractAddress, 'success');

                // Display contract address
                document.getElementById('deployedAddress').textContent = contractAddress;
                document.getElementById('contractAddressContainer').style.display = 'block';

                // Save to server
                try {
                    await fetch('/api/save-contract-address', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            address: contractAddress,
                            network: 'paseo',
                            deployer: selectedAccount.address,
                            timestamp: new Date().toISOString()
                        })
                    });

                    addLog('💾 Contract address saved to server', 'success');
                } catch (saveError) {
                    addLog('⚠️ Could not save to server (manual copy recommended)', 'error');
                }

                document.getElementById('deployButton').textContent = 'Deployed!';

            } catch (error) {
                addLog('❌ Deployment failed: ' + error.message, 'error');
                document.getElementById('deployButton').disabled = false;
                document.getElementById('deployButton').textContent = 'Deploy Contract';
            }
        }

        // Add log entry
        function addLog(message, type = 'info') {
            const log = document.getElementById('deploymentLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + type;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
    </script>
</body>
</html>`;
