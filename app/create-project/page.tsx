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
      const goalAmount = parseFloat(formData.goal_amount);
      const interestRate = parseFloat(formData.interest_rate);

      if (isNaN(goalAmount) || goalAmount <= 0) {
        throw new Error('Por favor ingresa una cantidad válida');
      }

      if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
        throw new Error('La tasa de interés debe estar entre 0% y 100%');
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal_amount: goalAmount,
          interest_rate: interestRate,
          creator_address: selectedAccount?.address || '',
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al crear proyecto');

      router.push(`/project/${result.project.id}`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Error al crear proyecto');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Billetera No Conectada</h2>
            <p className="text-gray-600 mb-6">
              Por favor conecta tu billetera Talisman para crear un proyecto
            </p>
            <p className="text-sm text-gray-500">
              Haz clic en "Conectar Talisman" en el menú superior
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Crear Nuevo Proyecto</h1>
          <p className="text-gray-600">Solicita financiamiento para tu negocio o proyecto</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Cómo funciona:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Crea tu proyecto con una descripción clara y meta de financiamiento</li>
            <li>Los inversores depositarán fondos en tu cuenta de garantía</li>
            <li>Una vez financiado completamente, puedes retirar los fondos</li>
            <li>Pagas el interés acordado para completar el ciclo</li>
          </ol>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Proyecto *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ej: Expansión de Cafetería"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                Un título claro y conciso para tu proyecto (máximo 100 caracteres)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Proyecto *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe tu proyecto, para qué necesitas el financiamiento y cómo usarás el dinero..."
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                Proporciona detalles sobre tu proyecto (máximo 1000 caracteres)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta de Financiamiento (USDT) *
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
                Ingresa cualquier cantidad mayor a $0
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Interés que Estás Dispuesto a Pagar *
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
                El interés que pagarás sobre los fondos prestados (0-100%)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando Proyecto...
                </span>
              ) : (
                'Crear Proyecto'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Creando proyecto como: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedAccount?.address}</span></p>
        </div>
      </main>
    </div>
  );
}
