'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';

export default function Home() {
  const { isConnected } = useWallet();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Decentralized Micro-Lending
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fund projects and help entrepreneurs grow their businesses using blockchain technology.
            Powered by Polkadot's XCM protocol for secure cross-chain transactions.
          </p>
        </div>

        {/* Action Cards (shown after wallet connection) */}
        {isConnected && (
          <div className="mb-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4 text-center">Get Started</h3>
            <p className="text-center mb-6 text-purple-100">Choose what you'd like to do</p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => router.push('/projects')}
                className="bg-white text-gray-900 p-8 rounded-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-4">💰</div>
                <h4 className="text-2xl font-bold mb-2">Start Lending</h4>
                <p className="text-gray-600">
                  Browse funding opportunities and earn returns by supporting entrepreneurs
                </p>
                <div className="mt-4 text-purple-600 font-semibold">
                  Browse Projects →
                </div>
              </button>

              <button
                onClick={() => router.push('/create-project')}
                className="bg-white text-gray-900 p-8 rounded-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-4">🚀</div>
                <h4 className="text-2xl font-bold mb-2">Request Funding</h4>
                <p className="text-gray-600">
                  Create a project and get funding from lenders to grow your business
                </p>
                <div className="mt-4 text-green-600 font-semibold">
                  Create Project →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">Lend to Projects</h3>
            <p className="text-gray-600">
              Browse projects and commit funds with transparent terms. Earn returns while helping entrepreneurs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-lg font-semibold mb-2">Blockchain Secured</h3>
            <p className="text-gray-600">
              All transactions are recorded on Polkadot. Your funds are managed via XCM cross-chain messaging.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Transparent Fees</h3>
            <p className="text-gray-600">
              Simple 2% platform fee on commitments and redemptions. Creator-defined interest rates on loans.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Lenders */}
            <div>
              <h4 className="text-lg font-semibold text-purple-600 mb-4">For Lenders</h4>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                  <div>
                    <p className="font-medium">Connect your Talisman wallet</p>
                    <p className="text-sm text-gray-600">Ensure you have USDT on Polkadot Asset Hub</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                  <div>
                    <p className="font-medium">Browse and select a project</p>
                    <p className="text-sm text-gray-600">Review project details and funding progress</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                  <div>
                    <p className="font-medium">Transfer funds via XCM</p>
                    <p className="text-sm text-gray-600">Seamlessly move USDT to Moonbeam parachain</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">4</span>
                  <div>
                    <p className="font-medium">Commit to the project</p>
                    <p className="text-sm text-gray-600">Choose lockup period (24h, 72h, or 7 days)</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* For Creators */}
            <div>
              <h4 className="text-lg font-semibold text-green-600 mb-4">For Creators</h4>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                  <div>
                    <p className="font-medium">Create your project</p>
                    <p className="text-sm text-gray-600">Describe your business and funding goal</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                  <div>
                    <p className="font-medium">Set your interest rate</p>
                    <p className="text-sm text-gray-600">Define the rate you're willing to pay (0-100%)</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                  <div>
                    <p className="font-medium">Receive lender commitments</p>
                    <p className="text-sm text-gray-600">Track your funding progress in real-time</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">4</span>
                  <div>
                    <p className="font-medium">Borrow and repay with interest</p>
                    <p className="text-sm text-gray-600">Access your capital and repay at your set rate</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isConnected ? (
          <div className="text-center bg-purple-50 rounded-lg p-12 border border-purple-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-6">Connect your Talisman wallet to begin lending or creating projects</p>
            <div className="text-sm text-gray-500">
              Click "Connect Wallet" in the header above
            </div>
          </div>
        ) : null}

        {/* Platform Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">2%</div>
            <div className="text-gray-600 mt-2">Platform Fee</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">0-100%</div>
            <div className="text-gray-600 mt-2">Creator-Defined Interest</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">24h-7d</div>
            <div className="text-gray-600 mt-2">Lockup Options</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>Powered by Polkadot XCM • Built on Asset Hub and Moonbeam</p>
          <p className="mt-2 text-sm">Bochica - Decentralized Micro-Lending Platform</p>
        </div>
      </footer>
    </div>
  );
}
