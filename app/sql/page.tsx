'use client';

import { Download } from 'lucide-react';

export default function SQLDownloadPage() {
  const handleDownload = async () => {
    try {
      const response = await fetch('/api/download-sql');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '003_add_project_balances.sql';
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Database Migration
          </h1>
          <p className="text-lg text-gray-600">
            Download the SQL migration file for Bochica platform
          </p>
        </div>

        {/* Migration Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                003_add_project_balances.sql
              </h2>
              <p className="text-gray-600">
                Migration for withdrawal functionality - Creates project_balances table
              </p>
            </div>
          </div>

          {/* What it does */}
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
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Enables withdrawal functionality for project creators
              </li>
            </ul>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download SQL Migration</span>
          </button>

          {/* Instructions */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">How to apply this migration:</h3>
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
                <span>Copy and paste the contents of the downloaded SQL file</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-blue-600 mr-3">5.</span>
                <span>Click "Run" or press Ctrl+Enter</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-blue-600 mr-3">6.</span>
                <span>Verify success with: <code className="bg-gray-200 px-2 py-0.5 rounded text-sm">SELECT * FROM project_balances;</code></span>
              </li>
            </ol>
          </div>

          {/* Warning */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> This migration must be run in your Supabase database for the withdrawal functionality to work.
            </p>
          </div>
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
