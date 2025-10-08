'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';
import { calculateFundingPercentage, calculatePlatformFee } from '@/lib/financial';
import { transferPlatformFee, transferToProjectEscrow, batchInvestmentTransfer } from '@/lib/polkadot';
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
  escrow_wallet_address: string;
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

  // Investment state
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [lockupPeriod, setLockupPeriod] = useState<'10min' | '24h' | '7days'>('24h');
  const [isInvesting, setIsInvesting] = useState(false);
  const [investError, setInvestError] = useState('');
  const [investSuccess, setInvestSuccess] = useState(false);

  // Withdraw state
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
      setError(err.message || 'Error al cargar el proyecto');
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
    if (!selectedAccount || !project) {
      setInvestError('Por favor conecta tu billetera primero');
      return;
    }

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      setInvestError('Por favor ingresa una cantidad válida');
      return;
    }

    if (amount > assetHubBalance) {
      setInvestError('Fondos insuficientes en tu billetera');
      return;
    }

    setIsInvesting(true);
    setInvestError('');

    try {
      const platformFee = calculatePlatformFee(amount);
      const netToProject = amount - platformFee;

      // Execute the batch transfer (platform fee + project funding)
      const result = await batchInvestmentTransfer(
        selectedAccount,
        project.escrow_wallet_address,
        amount,
        platformFee
      );

      console.log('Investment successful:', result);

      // Record the commitment in database
      const unlockDate = new Date();
      if (lockupPeriod === '10min') unlockDate.setMinutes(unlockDate.getMinutes() + 10);
      else if (lockupPeriod === '24h') unlockDate.setHours(unlockDate.getHours() + 24);
      else if (lockupPeriod === '7days') unlockDate.setDate(unlockDate.getDate() + 7);

      const { error: commitmentError } = await supabase
        .from('commitments')
        .insert({
          project_id: project.id,
          investor_address: selectedAccount.address,
          amount: amount,
          net_amount: netToProject,
          platform_fee: platformFee,
          lockup_period: lockupPeriod,
          unlock_date: unlockDate.toISOString(),
          status: 'active',
          transaction_hash: result.txHash || result.hash || null
        });

      if (commitmentError) {
        console.error('Warning: Failed to record commitment:', commitmentError);
        // Don't fail the whole investment, but log it
      }

      // Update project funding in database
      const newFunding = project.current_funding + netToProject;
      const newStatus = newFunding >= project.goal_amount ? 'funded' : 'active';

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          current_funding: newFunding,
          status: newStatus
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      setInvestSuccess(true);
      setTimeout(() => {
        setShowInvestModal(false);
        setInvestSuccess(false);
        setInvestAmount('');
        fetchProject();
        router.refresh();
      }, 2000);

    } catch (err: any) {
      console.error('Investment error:', err);
      setInvestError(err.message || 'Error al invertir. Por favor intenta de nuevo.');
    } finally {
      setIsInvesting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedAccount || !project) {
      setWithdrawError('Por favor conecta tu billetera primero');
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError('');

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          creatorAddress: selectedAccount.address
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al retirar fondos');

      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        fetchProject();
        fetchProjectBalance();
        router.refresh();
      }, 3000);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setWithdrawError(err.message || 'Error al retirar fondos. Por favor intenta de nuevo.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const amount = parseFloat(investAmount) || 0;
  const platformFee = calculatePlatformFee(amount);
  const netAmount = amount - platformFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="text-lg">Cargando proyecto...</div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Proyecto No Encontrado</h2>
            <p className="text-gray-600 mb-6">{error || 'Este proyecto no existe'}</p>
            <Link href="/projects" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
              Ver Proyectos
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
  const hasWithdrawn = isCreator && project.status === "completed" && project.withdrawal_tx_hash;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link href="/projects" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6">
          ← Volver a Proyectos
        </Link>

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
            {isFullyFunded && (
              <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                ✓ Completamente Fondeado
              </span>
            )}
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
            <div>
              <span className="font-semibold">Creado:</span> {new Date(project.created_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">Tasa de Interés:</span> <span className="text-green-600 font-bold">{project.interest_rate}%</span>
            </div>
            <div>
              <span className="font-semibold">Estado:</span> <span className="capitalize">{project.status}</span>
            </div>
            {isCreator && (
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                Tu Proyecto
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold text-gray-900">Progreso de Financiamiento</span>
              <span className="text-2xl font-bold text-purple-600">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`h-6 rounded-full transition-all duration-500 ${isFullyFunded ? 'bg-green-500' : 'bg-purple-600'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-lg mt-3">
              <span className="font-bold text-gray-900">${project.current_funding.toLocaleString()} recaudados</span>
              <span className="text-gray-600">de ${project.goal_amount.toLocaleString()} meta</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Creador del Proyecto</p>
            <p className="text-xs text-gray-600 font-mono break-all">{project.creator_address}</p>
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acerca de Este Proyecto</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.description}</p>
        </div>

        {/* Withdrawal Completed Message */}
        {hasWithdrawn && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white mb-6">
            <div className="flex items-start space-x-4">
              <div className="text-5xl">✅</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Retiro Completado</h2>
                <p className="mb-4 text-blue-100">
                  Retiraste el monto completo de <span className="font-bold">${project.current_funding.toFixed(2)} USDT</span> el{' '}
                  {new Date(project.withdrawal_date!).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="bg-blue-700 bg-opacity-50 rounded-lg p-4 text-sm">
                  <p className="font-semibold mb-2">📋 Detalles de la Transacción:</p>
                  <div className="space-y-1 text-blue-50">
                    <p><strong>Hash:</strong> {project.withdrawal_tx_hash?.slice(0, 20)}...{project.withdrawal_tx_hash?.slice(-20)}</p>
                    <p><strong>Comisión Plataforma:</strong> ${project.platform_fee_paid?.toFixed(2) || '0.00'} USDT (2%)</p>
                    <p><strong>Monto Recibido:</strong> ${(project.current_funding - (project.platform_fee_paid || 0)).toFixed(2)} USDT</p>
                  </div>
                  <a
                    href={`https://assethub-polkadot.subscan.io/extrinsic/${project.withdrawal_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-sm transition-colors"
                  >
                    Ver en Subscan →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Section */}
        {canWithdraw && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white mb-6">
            <h2 className="text-2xl font-bold mb-2">Solicitar Retiro</h2>
            <p className="mb-2 text-green-100">
              ¡Tu proyecto está completamente fondeado! Haz clic abajo para solicitar el retiro de{' '}
              <span className="font-bold text-white">
                ${projectBalance?.available_balance?.toFixed(2) || project.current_funding.toFixed(2)} USDT
              </span>{' '}
              a tu billetera.
            </p>
            <div className="mb-4 bg-green-700 bg-opacity-50 rounded-lg p-4 text-sm text-green-50">
              <p className="font-semibold mb-1">ℹ️ Cómo funciona:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Envías una solicitud de retiro</li>
                <li>Los fondos se transfieren inmediatamente desde la billetera de garantía a tu dirección</li>
                <li>Recibirás el USDT instantáneamente al aprobar</li>
                <li>Se crea un préstamo que debes pagar con {project.interest_rate}% de interés en 30 días</li>
              </ol>
            </div>
            {projectBalance && projectBalance.withdrawn_balance > 0 && (
              <p className="mb-4 text-sm text-green-200">
                Solicitado previamente: ${projectBalance.withdrawn_balance.toFixed(2)} USDT
              </p>
            )}
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? 'Enviando Solicitud...' : 'Solicitar Retiro'}
            </button>
            {withdrawError && (
              <div className="mt-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
                {withdrawError}
              </div>
            )}
            {withdrawSuccess && (
              <div className="mt-4 bg-white border border-green-300 text-green-800 px-4 py-3 rounded-lg">
                ✅ ¡Solicitud de retiro enviada exitosamente! Los fondos serán transferidos inmediatamente.
              </div>
            )}
          </div>
        )}

        {/* Investment Section */}
        {isConnected && !isCreator && project.status === 'active' && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Invertir en Este Proyecto</h2>
            <p className="mb-6 text-purple-100">
              Apoya a este emprendedor comprometiendo fondos. Gana {project.interest_rate}% de interés cuando pague.
            </p>
            <button
              className="px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-bold text-lg transition-colors"
              onClick={() => setShowInvestModal(true)}
            >
              Comprometer Fondos →
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Inversión Exitosa!</h3>
                    <p className="text-gray-600">Tus fondos han sido comprometidos a este proyecto.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Comprometer Fondos</h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ingresa cantidad"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Disponible: {assetHubBalance.toFixed(2)} USDT
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Período de Bloqueo</label>
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
                        Fondos bloqueados hasta que el creador pida prestado o expire el bloqueo
                      </p>
                    </div>

                    {amount > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monto de Inversión:</span>
                          <span className="font-semibold">${amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Comisión Plataforma (2%):</span>
                          <span className="font-semibold text-red-600">-${platformFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-semibold">Neto al Proyecto:</span>
                          <span className="font-bold text-purple-600">${netAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Retorno Esperado ({project.interest_rate}%):</span>
                          <span className="font-bold">${(amount * (1 + project.interest_rate / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Comisión de Gas (DOT):</span>
                          <span className="font-semibold">~0.02 DOT (~$0.14)</span>
                        </div>
                        {dotBalance < 0.05 && (
                          <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-700 font-medium">⚠️ ¡Saldo DOT bajo!</p>
                            <p className="text-xs text-yellow-600 mt-0.5">
                              Tienes {dotBalance.toFixed(4)} DOT. Asegúrate de tener suficiente para comisiones de gas.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {investError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {investError}
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowInvestModal(false)}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                        disabled={isInvesting}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleInvest}
                        disabled={isInvesting || !investAmount || amount <= 0}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold transition-colors"
                      >
                        {isInvesting ? 'Procesando...' : 'Comprometer Fondos'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {!isConnected && project.status === 'active' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conecta Tu Billetera</h3>
            <p className="text-gray-600">
              Conecta tu billetera Talisman para invertir en este proyecto
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
