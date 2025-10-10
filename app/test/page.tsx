'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PaseoTestContent = dynamic(() => Promise.resolve(TestContent), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">
    <p className="text-xl">Loading Paseo Test...</p>
  </div>
});

export default function PaseoTestPage() {
  return <PaseoTestContent />;
}

function TestContent() {
  const [api, setApi] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [injector, setInjector] = useState<any>(null);
  const [balance, setBalance] = useState<string>('0');
  const [escrowBalance, setEscrowBalance] = useState<string>('0');
  const [platformBalance, setPlatformBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [step1Hash, setStep1Hash] = useState<string>('');
  const [step1Status, setStep1Status] = useState<string>('');
  const [step1Executing, setStep1Executing] = useState(false);
  
  const [step2Hash, setStep2Hash] = useState<string>('');
  const [step2Status, setStep2Status] = useState<string>('');
  const [step2Executing, setStep2Executing] = useState(false);
  
  const [step3Hash, setStep3Hash] = useState<string>('');
  const [step3Status, setStep3Status] = useState<string>('');
  const [step3Executing, setStep3Executing] = useState(false);

  const PASEO_RPC = 'wss://paseo.rpc.amforc.com';
  const ESCROW_ADDRESS = '15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf'; // //1
  const PLATFORM_FEE_ADDRESS = '13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy'; // //0

  useEffect(() => {
    connectToPaseo();
  }, []);

  useEffect(() => {
    if (api) {
      updateBalances();
      const interval = setInterval(updateBalances, 10000);
      return () => clearInterval(interval);
    }
  }, [api, account]);

  async function connectToPaseo() {
    const { ApiPromise, WsProvider } = await import('@polkadot/api');
    try {
      const wsProvider = new WsProvider(PASEO_RPC);
      const paseoApi = await ApiPromise.create({ provider: wsProvider });
      setApi(paseoApi);
    } catch (error) {
      console.error('Failed to connect to Paseo:', error);
    }
  }

  async function connectWallet() {
    setIsConnecting(true);
    try {
      const { web3Enable, web3Accounts, web3FromAddress } = await import('@polkadot/extension-dapp');
      
      const extensions = await web3Enable('Bochica Paseo Test');
      if (extensions.length === 0) {
        alert('Please install Talisman or Polkadot.js extension');
        return;
      }

      const accounts = await web3Accounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const inj = await web3FromAddress(accounts[0].address);
        setInjector(inj);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }

  async function updateBalances() {
    if (!api) return;
    
    try {
      // User balance
      if (account) {
        const { data: { free } } = await api.query.system.account(account.address);
        const balancePAS = parseFloat(free.toString()) / 10**10;
        setBalance(balancePAS.toFixed(4));
      }
      
      // Escrow balance
      const escrow = await api.query.system.account(ESCROW_ADDRESS);
      const escrowPAS = parseFloat(escrow.data.free.toString()) / 10**10;
      setEscrowBalance(escrowPAS.toFixed(4));
      
      // Platform fee balance
      const platform = await api.query.system.account(PLATFORM_FEE_ADDRESS);
      const platformPAS = parseFloat(platform.data.free.toString()) / 10**10;
      setPlatformBalance(platformPAS.toFixed(4));
      
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  }

  async function step1LendToEscrow() {
    if (!api || !account || !injector) {
      alert('Please connect your wallet first');
      return;
    }

    setStep1Executing(true);
    setStep1Status('Preparing to lend 10 PAS to escrow...');
    setStep1Hash('');

    try {
      const amount = 10 * 10**10;
      const transfer = api.tx.balances.transferKeepAlive(ESCROW_ADDRESS, amount);

      setStep1Status('Waiting for signature...');

      const hash = await new Promise<string>((resolve, reject) => {
        transfer.signAndSend(account.address, { signer: injector.signer }, ({ status, dispatchError }: any) => {
          setStep1Status(`Status: ${status.type}`);

          if (status.isFinalized) {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                reject(new Error(`${decoded.section}.${decoded.name}`));
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else {
              resolve(status.asFinalized.toHex());
            }
          }
        }).catch(reject);
      });

      setStep1Hash(hash);
      setStep1Status('✅ Lent 10 PAS to escrow wallet!');
      setTimeout(updateBalances, 2000);

    } catch (error: any) {
      setStep1Status(`❌ Error: ${error.message}`);
    } finally {
      setStep1Executing(false);
    }
  }

  async function step2WithdrawFromEscrow() {
    if (!api || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setStep2Executing(true);
    setStep2Status('Preparing to withdraw 10 PAS from escrow (requires backend signing)...');
    setStep2Hash('');

    try {
      const response = await fetch('/api/test/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 10,
          recipientAddress: account.address
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      setStep2Hash(data.txHash);
      setStep2Status('✅ Withdrew 10 PAS from escrow to your wallet!');
      setTimeout(updateBalances, 2000);

    } catch (error: any) {
      setStep2Status(`❌ Error: ${error.message}`);
    } finally {
      setStep2Executing(false);
    }
  }

  async function step3RepayWithFee() {
    if (!api || !account || !injector) {
      alert('Please connect your wallet first');
      return;
    }

    setStep3Executing(true);
    setStep3Status('Preparing to repay 10 PAS + 2% fee (0.2 PAS)...');
    setStep3Hash('');

    try {
      const principalAmount = 10 * 10**10;
      const feeAmount = 0.2 * 10**10;
      
      // Create batch transaction
      const txEscrow = api.tx.balances.transferKeepAlive(ESCROW_ADDRESS, principalAmount);
      const txPlatform = api.tx.balances.transferKeepAlive(PLATFORM_FEE_ADDRESS, feeAmount);
      
      const batch = api.tx.utility.batch([txEscrow, txPlatform]);

      setStep3Status('Waiting for signature...');

      const hash = await new Promise<string>((resolve, reject) => {
        batch.signAndSend(account.address, { signer: injector.signer }, ({ status, dispatchError }: any) => {
          setStep3Status(`Status: ${status.type}`);

          if (status.isFinalized) {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                reject(new Error(`${decoded.section}.${decoded.name}`));
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else {
              resolve(status.asFinalized.toHex());
            }
          }
        }).catch(reject);
      });

      setStep3Hash(hash);
      setStep3Status('✅ Repaid 10.2 PAS (10 PAS to escrow + 0.2 PAS platform fee)!');
      setTimeout(updateBalances, 2000);

    } catch (error: any) {
      setStep3Status(`❌ Error: ${error.message}`);
    } finally {
      setStep3Executing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bochica - Paseo Testnet</h1>
          <p className="text-gray-600">Full Lending Cycle with Escrow & Platform Fee</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🌐 Network Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-bold text-purple-600">Paseo Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connection:</span>
                <span className={`font-bold ${api ? 'text-green-600' : 'text-red-600'}`}>
                  {api ? '✓ Connected' : '✗ Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👛 Your Wallet</h2>
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Address:</span>
                  <p className="font-mono text-xs break-all">{account.address}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-bold text-green-600">{balance} PAS</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📜 Smart Contract Wallets</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600 font-semibold">Escrow Wallet (//1):</span>
                <span className="font-bold text-blue-600">{escrowBalance} PAS</span>
              </div>
              <a
                href={`https://paseo.subscan.io/account/${ESCROW_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:text-blue-700 underline block break-all"
              >
                {ESCROW_ADDRESS}
              </a>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600 font-semibold">Platform Fee Wallet (//0):</span>
                <span className="font-bold text-green-600">{platformBalance} PAS</span>
              </div>
              <a
                href={`https://paseo.subscan.io/account/${PLATFORM_FEE_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:text-blue-700 underline block break-all"
              >
                {PLATFORM_FEE_ADDRESS}
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">🔄 Lending Cycle Demonstration</h2>
          <p className="text-blue-100">Execute the 3 steps to see the complete lending flow with escrow and platform fees</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Step 1: Lend to Escrow</h3>
          <p className="text-gray-600 mb-4">Investor sends 10 PAS to escrow wallet (//1)</p>
          
          <button
            onClick={step1LendToEscrow}
            disabled={!account || step1Executing}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold mb-4"
          >
            {step1Executing ? 'Processing...' : '💰 Lend 10 PAS to Escrow'}
          </button>

          {step1Status && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">{step1Status}</p>
            </div>
          )}

          {step1Hash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-semibold mb-2">Transaction Hash:</p>
              <a
                href={`https://paseo.subscan.io/extrinsic/${step1Hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:text-blue-700 underline break-all"
              >
                {step1Hash}
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-500">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Step 2: Withdraw from Escrow</h3>
          <p className="text-gray-600 mb-4">Creator withdraws 10 PAS from escrow (//1) to their wallet</p>
          
          <button
            onClick={step2WithdrawFromEscrow}
            disabled={!account || step2Executing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold mb-4"
          >
            {step2Executing ? 'Processing...' : '📤 Withdraw 10 PAS from Escrow'}
          </button>

          {step2Status && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">{step2Status}</p>
            </div>
          )}

          {step2Hash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-2">Transaction Hash:</p>
              <a
                href={`https://paseo.subscan.io/extrinsic/${step2Hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:text-blue-700 underline break-all"
              >
                {step2Hash}
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-purple-500">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Step 3: Repay with Platform Fee</h3>
          <p className="text-gray-600 mb-4">Repay 10 PAS to escrow + 0.2 PAS (2%) platform fee</p>
          
          <button
            onClick={step3RepayWithFee}
            disabled={!account || step3Executing}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold mb-4"
          >
            {step3Executing ? 'Processing...' : '💸 Repay 10.2 PAS (10 + 2% fee)'}
          </button>

          {step3Status && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">{step3Status}</p>
            </div>
          )}

          {step3Hash && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800 font-semibold mb-2">Transaction Hash:</p>
              <a
                href={`https://paseo.subscan.io/extrinsic/${step3Hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:text-blue-700 underline break-all"
              >
                {step3Hash}
              </a>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">✅ Complete Cycle Summary</h3>
          <ul className="space-y-2 text-green-50">
            <li>• <strong>Step 1:</strong> Investor lends 10 PAS → Escrow wallet (//1)</li>
            <li>• <strong>Step 2:</strong> Creator withdraws 10 PAS from Escrow → Creator wallet</li>
            <li>• <strong>Step 3:</strong> Creator repays 10 PAS to Escrow + 0.2 PAS (2%) to Platform (//0)</li>
            <li>• <strong>Result:</strong> Platform earns 0.2 PAS fee, funds secured in escrow</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
