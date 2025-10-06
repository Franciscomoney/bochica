'use client';

import { Download } from 'lucide-react';

export default function SQLDownloadPage() {
  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`/api/download-sql?file=${filename}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Database Migrations
          </h1>
          <p className="text-lg text-gray-600">
            Download SQL migration files for Bochica platform
          </p>
        </div>

        <div className="space-y-6">
          {/* Migration 1: Project Balances */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Migration #1: Project Balances
                </h2>
                <p className="text-gray-600 mb-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">003_add_project_balances.sql</code>
                </p>
                <p className="text-gray-600">
                  Creates project_balances table for tracking available and withdrawn funds
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What this migration does:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Creates <code className="bg-gray-200 px-2 py-0.5 rounded">project_balances</code> table
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Tracks available and withdrawn balances per project
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Adds automatic trigger to update balances on new investments
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleDownload('003_add_project_balances.sql')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Migration #1</span>
            </button>
          </div>

          {/* Migration 2: Withdrawal Requests */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Migration #2: Withdrawal Requests
                </h2>
                <p className="text-gray-600 mb-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">create-withdrawal-requests.sql</code>
                </p>
                <p className="text-gray-600">
                  Enables admin-approved withdrawal system for project creators
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What this migration does:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Creates <code className="bg-gray-200 px-2 py-0.5 rounded">withdrawal_requests</code> table
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Tracks pending, approved, and completed withdrawal requests
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Links withdrawal requests to loan records
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Stores blockchain transaction hash when admin processes withdrawal
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleDownload('create-withdrawal-requests.sql')}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Migration #2</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 text-xl">How to apply these migrations:</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">1.</span>
              <div>
                Go to your Supabase dashboard: 
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  https://supabase.com/dashboard
                </a>
              </div>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">2.</span>
              <span>Navigate to SQL Editor in your project</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">3.</span>
              <span>Click "New query"</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">4.</span>
              <span><strong>Run Migration #1 first</strong>, then Migration #2 (order matters!)</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">5.</span>
              <span>Copy and paste the contents of each downloaded SQL file</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">6.</span>
              <span>Click "Run" or press Ctrl+Enter for each migration</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">7.</span>
              <span>Verify success with: <code className="bg-gray-200 px-2 py-0.5 rounded text-sm">SELECT * FROM project_balances; SELECT * FROM withdrawal_requests;</code></span>
            </li>
          </ol>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Note:</strong> Both migrations must be run in your Supabase database for withdrawal functionality to work. Run them in order (#1, then #2).
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a 
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
