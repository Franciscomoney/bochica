'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserProfile {
  wallet_address: string;
  name: string;
  bio: string;
  links: string[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  created_at: string;
  project_id?: string;
}

export default function ProfilePage() {
  const { selectedAccount, assetHubBalance, moonbeamBalance, formatAddress } = useWallet();
  const [profile, setProfile] = useState<UserProfile>({
    wallet_address: '',
    name: '',
    bio: '',
    links: ['', '', '']
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedAccount?.address) {
      loadProfile();
      loadTransactions();
    }
  }, [selectedAccount]);

  async function loadProfile() {
    if (!selectedAccount?.address) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', selectedAccount.address)
      .single();

    if (data) {
      setProfile(data);
    } else {
      // Create default profile
      setProfile({
        wallet_address: selectedAccount.address,
        name: selectedAccount.meta.name || '',
        bio: '',
        links: ['', '', '']
      });
    }
  }

  async function loadTransactions() {
    if (!selectedAccount?.address) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_address', selectedAccount.address)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setTransactions(data);
    }
  }

  async function saveProfile() {
    if (!selectedAccount?.address) return;
    setIsSaving(true);

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: selectedAccount.address,
        name: profile.name,
        bio: profile.bio,
        links: profile.links.filter(link => link.trim() !== '')
      }, {
        onConflict: 'wallet_address'
      });

    setIsSaving(false);
    setIsEditing(false);

    if (error) {
      alert('Error saving profile: ' + error.message);
    }
  }

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please Connect Your Wallet</h1>
          <p className="text-gray-600">You need to connect your wallet to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                {profile.name?.charAt(0).toUpperCase() || selectedAccount.meta.name?.charAt(0).toUpperCase() || 'A'}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Links</label>
                      {[0, 1, 2].map((index) => (
                        <input
                          key={index}
                          type="url"
                          value={profile.links[index] || ''}
                          onChange={(e) => {
                            const newLinks = [...profile.links];
                            newLinks[index] = e.target.value;
                            setProfile({ ...profile, links: newLinks });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                          placeholder={`Link ${index + 1} (e.g., Twitter, GitHub, Website)`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {profile.name || selectedAccount.meta.name || 'Anonymous User'}
                    </h2>
                    <p className="text-sm font-mono text-gray-500 mb-3">{formatAddress(selectedAccount.address)}</p>
                    {profile.bio && <p className="text-gray-700 mb-3">{profile.bio}</p>}
                    {profile.links && profile.links.filter(l => l).length > 0 && (
                      <div className="flex space-x-3">
                        {profile.links.filter(link => link.trim()).map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 text-sm underline"
                          >
                            Link {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Balances */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Wallet Balances</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Asset Hub (USDT)</p>
                <p className="text-2xl font-bold text-gray-900">{assetHubBalance.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Moonbeam (GLMR)</p>
                <p className="text-2xl font-bold text-gray-900">{moonbeamBalance.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          </div>
          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{tx.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{tx.amount.toFixed(2)} USDT</p>
                      {tx.project_id && (
                        <Link href={`/project/${tx.project_id}`} className="text-sm text-purple-600 hover:text-purple-700">
                          View Project →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
