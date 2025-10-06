'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';
import { calculateFundingPercentage, calculatePlatformFee } from '@/lib/financial';
import { transferPlatformFee, transferToProjectEscrow ,
  batchInvestmentTransfer} from '@/lib/polkadot';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_funding: number;
  status: string;
  creator_address: string;
  interest_rate: number;
  created_at: string;
}

interface ProjectBalance {
  available_balance: number;
  withdrawn_balance: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected, selectedAccount, assetHubBalance, dotBalance } = useWallet();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Investment UI state
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [lockupPeriod, setLockupPeriod] = useState<'10min' | '24h' | '7days'>('10min');
  const [isInvesting, setIsInvesting] = useState(false);
  const [investError, setInvestError] = useState('');
  const [investSuccess, setInvestSuccess] = useState(false);

  // Withdraw UI state
  const [projectBalance, setProjectBalance] = useState<ProjectBalance | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchProjectBalance();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

      if (dbError) throw dbError;

      setProject(data);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectBalance = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('project_balances')
        .select('available_balance, withdrawn_balance')
        .eq('project_id', params.id)
        .single();

      if (!dbError && data) {
        setProjectBalance(data);
      }
    } catch (err) {
      console.error('Error fetching project balance:', err);
    }
  };

  const handleInvest = async () => {
    if (!selectedAccount || !project) return;

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      setInvestError('Please enter a valid amount');
      return;
    }

    if (amount > assetHubBalance) {
      setInvestError(`Insufficient balance. You have ${assetHubBalance.toFixed(2)} USDT`);
      return;
    }

    // Check DOT balance for gas fees
    const estimatedGas = 0.03; // ~0.01 per transfer × 2 transfers + buffer
    if (dotBalance < estimatedGas) {
      setInvestError(
        `Insufficient DOT for gas fees. You need at least ${estimatedGas} DOT but have ${dotBalance.toFixed(4)} DOT. Please add DOT to your Asset Hub wallet to pay for transaction fees.`
      );
      return;
    }

    setIsInvesting(true);
    setInvestError('');

    try {
      // Step 1: Execute batch transfer (fee + project amount in ONE transaction)
      const platformFee = calculatePlatformFee(amount);
      const netAmount = amount - platformFee;

      console.log(`Investing ${amount} USDT (${platformFee.toFixed(2)} fee + ${netAmount.toFixed(2)} to project)`);

      const transferResult = await batchInvestmentTransfer(
        selectedAccount.address,
        amount,
        platformFee,
        netAmount
      );

      if (!transferResult.success) {
        throw new Error(transferResult.error || "Investment transfer failed");
      }
      // Step 3: Calculate lockup expiry
      const lockupMinutesMap: Record<string, number> = {
        '10min': 10,
        '24h': 24 * 60,
        '7days': 7 * 24 * 60
      };

      const lockupMinutes = lockupMinutesMap[lockupPeriod];
      if (!lockupMinutes) {
        throw new Error();
      }

      const lockupExpiry = new Date();
      lockupExpiry.setMinutes(lockupExpiry.getMinutes() + lockupMinutes);

      // Step 4: Create commitment record
      const { error: commitError } = await supabase
        .from('commitments')
        .insert({
          project_id: project.id,
          investor_address: selectedAccount.address,
          amount: amount,
          net_amount: netAmount,
          platform_fee: platformFee,
          lockup_period: lockupPeriod,
          lockup_expiry: lockupExpiry.toISOString(),
          unlock_date: lockupExpiry.toISOString(), // Same as lockup_expiry
          status: 'active',
          transaction_hash: transferResult.transactionHash
        });

      if (commitError) throw commitError;

      // Step 5: Update project funding
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          current_funding: project.current_funding + netAmount
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      // Step 6: Record transaction
      await supabase
        .from('transactions')
        .insert({
          wallet_address: selectedAccount.address,
          type: 'commitment',
          amount: amount,
          project_id: project.id,
          transaction_hash: transferResult.transactionHash,
          details: {
            lockup_period: lockupPeriod,
            platform_fee: platformFee,
            net_amount: netAmount
          }
        });

      // Success!
      setInvestSuccess(true);
      setTimeout(() => {
        setShowInvestModal(false);
        setInvestSuccess(false);
        setInvestAmount('');
        fetchProject(); // Refresh project data
        fetchProjectBalance(); // Refresh balance
      }, 3000);

    } catch (err: any) {
      console.error('Investment error:', err);
      setInvestError(err.message || 'Investment failed. Please try again.');
    } finally {
      setIsInvesting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedAccount || !project) return;

    setIsWithdrawing(true);
    setWithdrawError('');

    try {
      // 1. Fetch current project balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('project_balances')
        .select('available_balance, withdrawn_balance')
        .eq('project_id', project.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK for first withdrawal
        throw new Error('Unable to fetch project balance: ' + balanceError.message);
      }

      const availableAmount = balanceData ? parseFloat(balanceData.available_balance.toString()) : project.current_funding;

      // 2. Validate project is fully funded
      if (project.current_funding < project.goal_amount) {
        throw new Error('Project must be fully funded before withdrawal');
      }

      if (availableAmount <= 0) {
        throw new Error('No funds available to withdraw');
      }

      // 3. Create loan record
      const loanDueDate = new Date();
      loanDueDate.setDate(loanDueDate.getDate() + 30); // 30 days from now

      const principalAmount = availableAmount;
      const interestAmount = (principalAmount * project.interest_rate) / 100;
      const totalRepayment = principalAmount + interestAmount;

      const { error: loanError } = await supabase
        .from('loans')
        .insert({
          project_id: project.id,
          borrower_address: selectedAccount.address,
          principal_amount: principalAmount,
          interest_amount: interestAmount,
          total_repayment: totalRepayment,
          status: 'active',
          due_date: loanDueDate.toISOString()
        });

      if (loanError) {
        console.error('Loan record error:', loanError);
        throw new Error('Failed to create loan record: ' + loanError.message);
      }

      // 4. Update project balance
      const { error: updateError } = await supabase
        .from('project_balances')
        .upsert({
          project_id: project.id,
          available_balance: 0,
          withdrawn_balance: availableAmount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id'
        });

      if (updateError) {
        console.error('Balance update error:', updateError);
        throw new Error('Failed to update balance: ' + updateError.message);
      }

      // 5. Update project status to 'borrowing'
      const { error: statusError } = await supabase
        .from('projects')
        .update({ status: 'borrowing' })
        .eq('id', project.id);

      if (statusError) {
        console.error('Status update error:', statusError);
      }

      // 6. Create transaction record
      await supabase
        .from('transactions')
        .insert({
          wallet_address: selectedAccount.address,
          type: 'borrow',
          amount: availableAmount,
          project_id: project.id,
          details: {
            principal: principalAmount,
            interest: interestAmount,
            total_repayment: totalRepayment,
            due_date: loanDueDate.toISOString(),
            note: 'Funds marked for disbursement from escrow wallet'
          }
        });

      // Success!
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        fetchProject(); // Refresh project data
        fetchProjectBalance(); // Refresh balance
        router.refresh();
      }, 3000);

    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setWithdrawError(err.message || 'Withdrawal failed. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="text-lg">Loading project...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This project does not exist'}</p>
            <Link
              href="/projects"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              Browse Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const progress = calculateFundingPercentage(project.current_funding, project.goal_amount);
  const isFullyFunded = progress >= 100;
  const isCreator = selectedAccount?.address === project.creator_address;
  const canWithdraw = isCreator && isFullyFunded && project.status === 'funded';
  const amount = parseFloat(investAmount) || 0;
  const platformFee = calculatePlatformFee(amount);
  const netAmount = amount - platformFee;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6"
        >
          ← Back to Projects
        </Link>

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
            {isFullyFunded && (
              <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                ✓ Fully Funded
              </span>
            )}
          </div>

          {/* Project Meta */}
          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
            <div>
              <span className="font-semibold">Created:</span>{' '}
              {new Date(project.created_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">Interest Rate:</span>{' '}
              <span className="text-green-600 font-bold">{project.interest_rate}%</span>
            </div>
            <div>
              <span className="font-semibold">Status:</span>{' '}
              <span className="capitalize">{project.status}</span>
            </div>
            {isCreator && (
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                Your Project
              </div>
            )}
          </div>

          {/* Funding Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold text-gray-900">Funding Progress</span>
              <span className="text-2xl font-bold text-purple-600">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`h-6 rounded-full transition-all duration-500 ${
                  isFullyFunded ? 'bg-green-500' : 'bg-purple-600'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-lg mt-3">
              <span className="font-bold text-gray-900">
                ${project.current_funding.toLocaleString()} raised
              </span>
              <span className="text-gray-600">
                of ${project.goal_amount.toLocaleString()} goal
              </span>
            </div>
          </div>

          {/* Creator Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Project Creator</p>
            <p className="text-xs text-gray-600 font-mono break-all">
              {project.creator_address}
            </p>
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Project</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Withdrawal Section - Only for Project Creator */}
        {canWithdraw && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white mb-6">
            <h2 className="text-2xl font-bold mb-2">Withdraw Project Funds</h2>
            <p className="mb-4 text-green-100">
              Your project is fully funded! You can now withdraw{' '}
              <span className="font-bold text-white">
                ${projectBalance?.available_balance?.toFixed(2) || project.current_funding.toFixed(2)} USDT
              </span>
              {' '}to start your project.
            </p>
            {projectBalance && projectBalance.withdrawn_balance > 0 && (
              <p className="mb-4 text-sm text-green-200">
                Previously withdrawn: ${projectBalance.withdrawn_balance.toFixed(2)} USDT
              </p>
            )}
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? 'Processing Withdrawal...' : 'Withdraw Funds'}
            </button>
            {withdrawError && (
              <div className="mt-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
                {withdrawError}
              </div>
            )}
            {withdrawSuccess && (
              <div className="mt-4 bg-white border border-green-300 text-green-800 px-4 py-3 rounded-lg">
                ✅ Withdrawal successful! Loan created. Admin will process the transfer from escrow wallet.
              </div>
            )}
          </div>
        )}

        {/* Investment Section */}
        {isConnected && !isCreator && project.status === 'active' && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Lend to This Project</h2>
            <p className="mb-6 text-purple-100">
              Support this entrepreneur by committing funds. Earn {project.interest_rate}% interest when they repay.
            </p>
            <button
              className="px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-bold text-lg transition-colors"
              onClick={() => setShowInvestModal(true)}
            >
              Commit Funds →
            </button>
          </div>
        )}

        {/* Investment Modal */}
        {showInvestModal && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowInvestModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
                {investSuccess ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Investment Successful!</h3>
                    <p className="text-gray-600">Your funds have been committed to this project.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Commit Funds</h3>

                    {/* Amount Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (USDT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter amount"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {assetHubBalance.toFixed(2)} USDT
                      </p>
                    </div>

                    {/* Lockup Period */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lockup Period
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['10min', '24h', '7days'] as const).map((period) => (
                          <button
                            key={period}
                            onClick={() => setLockupPeriod(period)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              lockupPeriod === period
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Funds are locked until creator borrows or lockup expires
                      </p>
                    </div>

                    {/* Fee Breakdown */}
                    {amount > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investment Amount:</span>
                          <span className="font-semibold">${amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Fee (2%):</span>
                          <span className="font-semibold text-red-600">-${platformFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-semibold">Net to Project:</span>
                          <span className="font-bold text-purple-600">${netAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Expected Return ({project.interest_rate}%):</span>
                          <span className="font-bold">${(amount * (1 + project.interest_rate / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Gas Fee (DOT):</span>
                          <span className="font-semibold">~0.02 DOT (~$0.14)</span>
                        </div>
                        {dotBalance < 0.05 && (
                          <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-700 font-medium">⚠️ Low DOT balance!</p>
                            <p className="text-xs text-yellow-600 mt-0.5">
                              You have {dotBalance.toFixed(4)} DOT. Make sure you have enough for gas fees.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {investError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {investError}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowInvestModal(false)}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                        disabled={isInvesting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleInvest}
                        disabled={isInvesting || !investAmount || amount <= 0}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold transition-colors"
                      >
                        {isInvesting ? 'Processing...' : 'Commit Funds'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Not Connected Message */}
        {!isConnected && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">
              Connect your Talisman wallet to invest in this project
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
