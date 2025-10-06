'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalFunding: 0,
    activeLoans: 0,
    platformFees: 0,
    totalInvestors: 0,
    totalBorrowers: 0,
    recentTransactions: []
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/admin');
      if (!res.ok) {
        router.push('/admin');
      }
    } catch (error) {
      router.push('/admin');
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch real data from Supabase
      const { supabase } = await import('@/lib/supabase');

      // Get total projects
      const { data: projects } = await supabase.from('projects').select('*');
      const totalProjects = projects?.length || 0;

      // Calculate total funding
      const totalFunding = projects?.reduce((sum, p) => sum + Number(p.current_funding || 0), 0) || 0;

      // Get active loans
      const { data: loans } = await supabase.from('loans').select('*').eq('status', 'active');
      const activeLoans = loans?.length || 0;

      // Calculate platform fees from transactions
      const { data: txs } = await supabase.from('transactions').select('platform_fee');
      const platformFees = txs?.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0) || 0;

      // Get unique investors
      const { data: commitments } = await supabase.from('commitments').select('investor_address');
      const uniqueInvestors = new Set(commitments?.map(c => c.investor_address) || []);
      const totalInvestors = uniqueInvestors.size;

      // Get unique borrowers
      const { data: loansData } = await supabase.from('loans').select('borrower_address');
      const uniqueBorrowers = new Set(loansData?.map(l => l.borrower_address) || []);
      const totalBorrowers = uniqueBorrowers.size;

      // Get recent transactions
      const { data: recentTxs } = await supabase
        .from('transactions')
        .select('*, projects(title)')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentTransactions = recentTxs?.map(tx => ({
        id: tx.id,
        type: tx.tx_type,
        amount: Number(tx.amount),
        user: tx.user_address.slice(0, 20) + '...',
        project: tx.projects?.title || 'Unknown',
        time: new Date(tx.created_at).toLocaleString(),
        status: tx.status
      })) || [];

      setStats({
        totalProjects,
        totalFunding,
        activeLoans,
        platformFees,
        totalInvestors,
        totalBorrowers,
        recentTransactions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set to zeros if error
      setStats({
        totalProjects: 0,
        totalFunding: 0,
        activeLoans: 0,
        platformFees: 0,
        totalInvestors: 0,
        totalBorrowers: 0,
        recentTransactions: []
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    // Clear session cookie
    await fetch('/api/auth/admin', { method: 'DELETE' });
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-indigo-100 mt-1">Bochica Platform Overview & Management</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProjects}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Funding</p>
                <p className="text-3xl font-bold text-green-600 mt-2">${stats.totalFunding.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Loans</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.activeLoans}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Platform Fees</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">${stats.platformFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">2% on transactions</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Investors</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalInvestors}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Borrowers</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">{stats.totalBorrowers}</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left pb-3 font-semibold text-gray-700">Amount</th>
                  <th className="text-left pb-3 font-semibold text-gray-700">User</th>
                  <th className="text-left pb-3 font-semibold text-gray-700">Project</th>
                  <th className="text-left pb-3 font-semibold text-gray-700">Time</th>
                  <th className="text-left pb-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tx.type === 'commitment' ? 'bg-green-100 text-green-700' :
                        tx.type === 'borrow' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 font-semibold">${tx.amount.toLocaleString()}</td>
                    <td className="py-4 font-mono text-sm text-gray-600">{tx.user}</td>
                    <td className="py-4 text-gray-700">{tx.project}</td>
                    <td className="py-4 text-gray-600">{tx.time}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
