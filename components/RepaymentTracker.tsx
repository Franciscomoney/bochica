'use client';

import { useState } from 'react';
import { Copy, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface RepaymentTrackerProps {
  projectId: string;
  projectName: string;
  escrowAddress: string;
  expectedAmount: number;
  currentStatus: string;
  dueDate?: string;
  loanDetails?: {
    capital: number;
    interest: number;
    interestRate: number;
  };
}

export default function RepaymentTracker({
  projectId,
  projectName,
  escrowAddress,
  expectedAmount,
  currentStatus,
  dueDate,
  loanDetails
}: RepaymentTrackerProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheckRepayment = async () => {
    setChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, checkerType: 'manual' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check repayment');
      }

      setResult(data);

      // If repaid, refresh the page after 2 seconds
      if (data.repaid) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check repayment status');
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatUSDT = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getDaysRemaining = () => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysRemaining = getDaysRemaining();
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">Repayment Status</h3>
        {currentStatus === 'repaid' ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold">Fully Repaid</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="w-6 h-6" />
            <span className="font-semibold">Awaiting Repayment</span>
          </div>
        )}
      </div>

      {/* Loan Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Loan Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Capital Received</p>
            <p className="text-lg font-bold text-gray-900">
              {loanDetails ? formatUSDT(loanDetails.capital) : formatUSDT(expectedAmount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              Interest ({loanDetails?.interestRate || 0}%)
            </p>
            <p className="text-lg font-bold text-gray-900">
              {loanDetails ? formatUSDT(loanDetails.interest) : formatUSDT(0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Repayment Due</p>
            <p className="text-xl font-bold text-purple-600">
              {formatUSDT(expectedAmount)}
            </p>
          </div>
          {dueDate && (
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(dueDate).toLocaleDateString()}
              </p>
              {daysRemaining !== null && (
                <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                  {isOverdue
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : `${daysRemaining} days remaining`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Repayment Instructions */}
      {currentStatus !== 'repaid' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            How to Repay
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Send exactly {formatUSDT(expectedAmount)} USDT to the escrow address below</li>
            <li>Use Asset Hub on Polkadot (not other networks)</li>
            <li>After sending, click "Check Repayment Status" to verify</li>
            <li>Once confirmed, your loan will be marked as repaid</li>
          </ol>
        </div>
      )}

      {/* Escrow Address */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Escrow Wallet Address (send repayment here)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={escrowAddress}
            readOnly
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
          />
          <button
            onClick={() => copyToClipboard(escrowAddress)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Check Repayment Button */}
      <button
        onClick={handleCheckRepayment}
        disabled={checking || currentStatus === 'repaid'}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {checking ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Checking blockchain...
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5" />
            Check Repayment Status
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div
          className={`mt-4 rounded-lg p-4 border ${
            result.repaid
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.repaid ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold mb-2 ${
                  result.repaid ? 'text-green-900' : 'text-yellow-900'
                }`}
              >
                {result.message}
              </p>
              {result.repaid ? (
                <div className="space-y-1 text-sm text-green-800">
                  <p>Amount Received: {formatUSDT(result.receivedAmount)}</p>
                  <p>Expected Amount: {formatUSDT(result.expectedAmount)}</p>
                  {result.overpayment > 0 && (
                    <p>Overpayment: {formatUSDT(result.overpayment)}</p>
                  )}
                  <p className="mt-2 font-semibold">
                    Thank you for completing your repayment!
                  </p>
                </div>
              ) : (
                <div className="space-y-1 text-sm text-yellow-800">
                  <p>Current Balance: {formatUSDT(result.currentBalance || 0)}</p>
                  <p>Expected Amount: {formatUSDT(result.expectedAmount)}</p>
                  <p className="font-semibold">
                    Remaining: {formatUSDT(result.remaining)}
                  </p>
                  <p>
                    Completion: {result.percentageRepaid.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      {currentStatus !== 'repaid' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Repayment checks are recorded on the blockchain.
            The system automatically updates your loan status when full repayment is detected.
          </p>
        </div>
      )}
    </div>
  );
}
