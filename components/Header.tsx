'use client';

import { useWallet } from '@/contexts/WalletContext';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const {
    isConnected,
    isConnecting,
    selectedAccount,
    assetHubBalance,
    dotBalance,
    connectWallet,
    disconnectWallet,
    formatAddress,
    error
  } = useWallet();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <div className="flex items-center">
                <svg width="140" height="36" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="28" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold" fill="#7C3AED">BOCHICA</text>
                </svg>
              </div>
            </Link>

            {isConnected && (
              <nav className="flex items-center space-x-6">
                <Link href="/projects" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
                  Descubrir
                </Link>
                <Link href="/create-project" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
                  Crear proyecto
                </Link>
              </nav>
            )}
          </div>

          {/* Wallet Section */}
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isConnecting ? 'Conectando...' : 'Conectar Billetera'}
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Account Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {selectedAccount?.meta.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedAccount?.meta.name || 'Cuenta'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsDropdownOpen(false)}
                      />

                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="p-4 border-b border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Billetera Conectada</p>
                          <p className="text-sm font-mono text-gray-700 break-all">
                            {formatAddress(selectedAccount?.address || '')}
                          </p>
                        </div>
                        <div className="p-3">
                          <div className="mb-2">
                            <p className="text-xs text-gray-500">Saldo Asset Hub</p>
                            <p className="text-sm font-semibold">{assetHubBalance.toFixed(2)} USDT</p>
                          </div>
                          <div className="mb-3">
                            <p className="text-xs text-gray-500">Saldo DOT (Comisiones de Gas)</p>
                            <p className="text-sm font-semibold">{dotBalance.toFixed(4)} DOT</p>
                            {dotBalance < 0.05 && (
                              <div className="mt-1 px-2 py-1 bg-red-50 border border-red-200 rounded">
                                <p className="text-xs text-red-600 font-medium">⚠️ Gas bajo!</p>
                                <p className="text-xs text-red-500 mt-0.5">Agrega ~0.1 DOT</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-2 border-t border-gray-200">
                            <Link
                              href="/profile"
                              onClick={() => setIsDropdownOpen(false)}
                              className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors font-medium text-center"
                            >
                              👤 Perfil
                            </Link>
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false);
                                disconnectWallet();
                              }}
                              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
                            >
                              🔌 Desconectar Billetera
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="py-2">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
