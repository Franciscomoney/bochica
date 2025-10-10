const fs = require('fs');

const filePath = 'app/project/[id]/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// 1. Add repayment state variables after withdraw state
const withdrawStateMarker = '  // Withdraw state';
const repaymentStateCode = `
  // Repayment state
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [repayError, setRepayError] = useState('');
  const [repaySuccess, setRepaySuccess] = useState(false);
`;

let updatedContent = content.replace(
  withdrawStateMarker,
  withdrawStateMarker + repaymentStateCode
);

// 2. Add repayment handler function before return statement
const returnMarker = '  return (';
const repaymentFunction = `
  const handleRepayLoan = async () => {
    if (!selectedAccount || !project || !projectBalance) {
      setRepayError('Missing required data');
      return;
    }

    const withdrawnAmount = projectBalance.withdrawn_balance;
    if (withdrawnAmount <= 0) {
      setRepayError('No hay fondos para pagar');
      return;
    }

    const principal = withdrawnAmount;
    const interest = principal * (project.interest_rate / 100);
    const totalRepayment = principal + interest;
    const platformFee = totalRepayment * 0.02;
    const totalToPay = totalRepayment + platformFee;

    if (assetHubBalance < totalToPay) {
      setRepayError(\`Saldo insuficiente. Necesitas $\${totalToPay.toFixed(2)} USDT\`);
      return;
    }

    setIsRepaying(true);
    setRepayError('');

    try {
      const response = await fetch('/api/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          amount: totalRepayment,
          platformFee: platformFee,
          creatorAddress: selectedAccount.address
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      setRepaySuccess(true);
      setTimeout(() => {
        router.refresh();
        setShowRepayModal(false);
      }, 3000);

    } catch (error: any) {
      setRepayError(error.message || 'Error al pagar el préstamo');
    } finally {
      setIsRepaying(false);
    }
  };

`;

updatedContent = updatedContent.replace(returnMarker, repaymentFunction + returnMarker);

// 3. Add repayment UI before withdrawal section
const withdrawalSectionMarker = '        {/* Withdrawal Section */}';
const repaymentUI = `        {/* Repayment Dashboard */}
        {isCreator && projectBalance && projectBalance.withdrawn_balance > 0 && !hasWithdrawn && (
          <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-xl p-8 text-white mb-6 shadow-2xl">
            <div className="flex items-start space-x-4">
              <div className="text-6xl">💸</div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-3">Panel de Pago del Préstamo</h2>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-orange-100 text-sm mb-1">💰 Monto Prestado</p>
                      <p className="text-3xl font-bold">$\${projectBalance.withdrawn_balance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-orange-100 text-sm mb-1">📈 Interés ({project.interest_rate}%)</p>
                      <p className="text-3xl font-bold">
                        $\${(projectBalance.withdrawn_balance * (project.interest_rate / 100)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white border-opacity-30 pt-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-orange-100 text-sm mb-1">💵 Subtotal</p>
                        <p className="text-2xl font-bold">
                          $\${(projectBalance.withdrawn_balance * (1 + project.interest_rate / 100)).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-orange-100 text-sm mb-1">🏦 Comisión Plataforma (2%)</p>
                        <p className="text-2xl font-bold">
                          $\${(projectBalance.withdrawn_balance * (1 + project.interest_rate / 100) * 0.02).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 text-gray-900">
                    <p className="text-sm font-semibold mb-1">💎 TOTAL A PAGAR</p>
                    <p className="text-4xl font-black">
                      $\${(projectBalance.withdrawn_balance * (1 + project.interest_rate / 100) * 1.02).toFixed(2)} USDT
                    </p>
                  </div>
                </div>

                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">⏰ Plazo de Pago</span>
                    <span className="text-sm font-bold">30 días desde el retiro</span>
                  </div>
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-3 mb-2">
                    <div className="bg-yellow-400 h-3 rounded-full" style={{ width: '83%' }}></div>
                  </div>
                  <p className="text-xs text-orange-100">25 días restantes</p>
                </div>

                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold mb-2">💼 Tu Saldo USDT:</p>
                  <p className="text-2xl font-bold">
                    {assetHubBalance.toFixed(2)} USDT{' '}
                    {assetHubBalance >= (projectBalance.withdrawn_balance * (1 + project.interest_rate / 100) * 1.02) ? (
                      <span className="text-green-300 text-sm">✅ Suficiente</span>
                    ) : (
                      <span className="text-red-300 text-sm">❌ Insuficiente</span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => setShowRepayModal(true)}
                  disabled={assetHubBalance < (projectBalance.withdrawn_balance * (1 + project.interest_rate / 100) * 1.02)}
                  className="w-full px-8 py-4 bg-white text-red-600 rounded-xl hover:bg-gray-100 font-bold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  💳 Pagar Préstamo Ahora
                </button>

                {assetHubBalance < (projectBalance.withdrawn_balance * (1 + project.interest_rate / 100) * 1.02) && (
                  <p className="mt-3 text-sm text-yellow-200 text-center">
                    ⚠️ Necesitas más USDT para pagar este préstamo
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Repayment Modal */}
        {showRepayModal && projectBalance && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-40" onClick={() => !isRepaying && setShowRepayModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                {repaySuccess ? (
                  <div className="text-center">
                    <div className="text-7xl mb-4">✅</div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">¡Préstamo Pagado!</h3>
                    <p className="text-gray-600 mb-2">Tu pago ha sido procesado exitosamente.</p>
                    <p className="text-sm text-gray-500">Redirigiendo...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Confirmar Pago del Préstamo</h3>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                      <h4 className="font-bold text-gray-900 mb-4">Resumen del Pago:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Principal:</span>
                          <span className="font-semibold">$\${projectBalance.withdrawn_balance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interés ({project.interest_rate}%):</span>
                          <span className="font-semibold text-orange-600">
                            +$\${(projectBalance.withdrawn_balance * (project.interest_rate / 100)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-semibold">Subtotal:</span>
                          <span className="font-bold">
                            $\${(projectBalance.withdrawn_balance * (1 + project.interest_rate / 100)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Comisión Plataforma (2%):</span>
                          <span className="font-semibold text-red-600">
                            +$\${(projectBalance.withdrawn_balance * (1 + project.interest_rate / 100) * 0.02).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                          <span className="text-gray-900 font-bold text-lg">TOTAL:</span>
                          <span className="font-black text-xl text-purple-600">
                            $\${(projectBalance.withdrawn_balance * (1 + project.interest_rate / 100) * 1.02).toFixed(2)} USDT
                          </span>
                        </div>
                      </div>
                    </div>

                    {repayError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {repayError}
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowRepayModal(false)}
                        disabled={isRepaying}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleRepayLoan}
                        disabled={isRepaying}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-semibold transition-all"
                      >
                        {isRepaying ? 'Procesando...' : '💳 Confirmar Pago'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

`;

updatedContent = updatedContent.replace(withdrawalSectionMarker, repaymentUI + withdrawalSectionMarker);

fs.writeFileSync(filePath, updatedContent);
console.log('✅ Successfully added repayment functionality');

