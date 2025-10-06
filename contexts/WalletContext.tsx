'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import {
  enableWallet,
  getAssetHubBalance,
  getAssetHubDotBalance,
  getRelayChainDotBalance,
  getMoonbeamBalance,
  formatAddress as formatAddr,
} from '@/lib/polkadot';
import { setUserAddress } from '@/lib/supabase';

interface WalletContextType {
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  assetHubBalance: number;
  dotBalance: number;
  moonbeamBalance: number;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectAccount: (account: InjectedAccountWithMeta) => void;
  refreshBalances: () => Promise<void>;
  formatAddress: (address: string, length?: number) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [assetHubBalance, setAssetHubBalance] = useState<number>(0);
  const [dotBalance, setDotBalance] = useState<number>(0);
  const [moonbeamBalance, setMoonbeamBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const savedAccount = localStorage.getItem('selectedAccount');
    if (savedAccount) {
      connectWallet();
    }
  }, []);

  // Refresh balances when account changes
  useEffect(() => {
    if (selectedAccount) {
      refreshBalances();
    }
  }, [selectedAccount]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletAccounts = await enableWallet();
      setAccounts(walletAccounts);

      // Auto-select first account or previously selected
      const savedAddress = localStorage.getItem('selectedAccount');
      const accountToSelect = savedAddress
        ? walletAccounts.find(acc => acc.address === savedAddress) || walletAccounts[0]
        : walletAccounts[0];

      if (accountToSelect) {
        setSelectedAccount(accountToSelect);
        localStorage.setItem('selectedAccount', accountToSelect.address);

        // Set user address for Supabase RLS
        await setUserAddress(accountToSelect.address);

        setIsConnected(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccounts([]);
    setSelectedAccount(null);
    setAssetHubBalance(0);
    setMoonbeamBalance(0);
    setIsConnected(false);
    localStorage.removeItem('selectedAccount');
  };

  const selectAccount = async (account: InjectedAccountWithMeta) => {
    setSelectedAccount(account);
    localStorage.setItem('selectedAccount', account.address);

    // Update Supabase RLS context
    await setUserAddress(account.address);

    // Refresh balances for new account
    await refreshBalances();
  };

  const refreshBalances = async () => {
    if (!selectedAccount) return;

    try {
      const [assetHub, assetHubDot] = await Promise.all([
        getAssetHubBalance(selectedAccount.address),
        getAssetHubDotBalance(selectedAccount.address),
      ]);

      setAssetHubBalance(assetHub);
      setDotBalance(assetHubDot); // Asset Hub DOT for transaction fees
    } catch (err) {
      console.error('Error refreshing balances:', err);
    }
  };

  const formatAddress = (address: string, length: number = 6): string => {
    return formatAddr(address, length);
  };

  const value: WalletContextType = {
    accounts,
    selectedAccount,
    assetHubBalance,
    dotBalance,
    moonbeamBalance,
    isConnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
    selectAccount,
    refreshBalances,
    formatAddress,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
