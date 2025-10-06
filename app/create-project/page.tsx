'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';

export default function CreateProjectPage() {
  const { isConnected, selectedAccount } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    interest_rate: '5',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { supabase } = await import('@/lib/supabase');

      // Validate inputs
      const goalAmount = parseFloat(formData.goal_amount);
      const interestRate = parseFloat(formData.interest_rate);

      if (isNaN(goalAmount) || goalAmount <= 0) {
        throw new Error('Please enter a valid goal amount');
      }

      if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
        throw new Error('Interest rate must be between 0% and 100%');
      }

      // Create project in database
      const { data, error: dbError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          goal_amount: goalAmount,
          interest_rate: interestRate,
          current_funding: 0,
          status: 'active',
          creator_address: selectedAccount?.address || '',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Redirect to project page
      router.push(`/project/${data.id}`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Talisman wallet to create a project
            </p>
            <p className="text-sm text-gray-500">
              Click "Connect Talisman" in the header above
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">Request funding for your business or project</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">📋 How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Create your project with a clear description and funding goal</li>
            <li>Investors will commit funds to your project</li>
            <li>Once funded, you can borrow against the committed amount</li>
            <li>Repay with 5% interest to unlock investor funds</li>
          </ol>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Coffee Shop Expansion"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                A clear, concise title for your project (max 100 characters)
              </p>
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe your project, what you need funding for, and how you'll use the money..."
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide details about your project and funding needs (max 1000 characters)
              </p>
            </div>

            {/* Funding Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Goal (USDT) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.goal_amount}
                  onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="5000.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter any amount greater than $0
              </p>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate You're Willing to Pay *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="5.0"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-semibold">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The interest rate you'll pay when you borrow against committed funds (0-100%)
              </p>
            </div>

            {/* Creator Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Creator Wallet</p>
              <p className="text-xs text-gray-600 font-mono break-all">
                {selectedAccount?.address}
              </p>
            </div>

            {/* Platform Fee Notice */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-900">
                <span className="font-semibold">Platform Fee:</span> 2% on all transactions
                <br />
                <span className="font-semibold">Loan Interest:</span> 5% on borrowed amounts
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Project...' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your project will be visible to investors immediately after creation</p>
        </div>
      </main>
    </div>
  );
}
