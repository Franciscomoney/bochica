'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  goal_amount: number;
  current_funding: number;
  status: string;
  created_at: string;
}

interface Investment {
  project_id: string;
  amount: number;
  project: {
    id: string;
    title: string;
  };
}

export default function ProfilePage() {
  const { selectedAccount, assetHubBalance, polkadotBalance, formatAddress } = useWallet();
  const [createdProjects, setCreatedProjects] = useState<Project[]>([]);
  const [fundedProjects, setFundedProjects] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedAccount?.address) {
      loadUserData();
    }
  }, [selectedAccount]);

  async function loadUserData() {
    if (!selectedAccount?.address) return;
    setLoading(true);

    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('creator_address', selectedAccount.address)
      .order('created_at', { ascending: false });

    if (projects) {
      setCreatedProjects(projects);
    }

    const { data: investments } = await supabase
      .from('transactions')
      .select('project_id, amount, project:projects(id, title)')
      .eq('investor_address', selectedAccount.address)
      .eq('transaction_type', 'investment')
      .order('created_at', { ascending: false });

    if (investments) {
      const grouped = investments.reduce((acc: any, inv: any) => {
        const projectId = inv.project_id;
        if (!acc[projectId]) {
          acc[projectId] = {
            project_id: projectId,
            amount: 0,
            project: inv.project
          };
        }
        acc[projectId].amount += inv.amount;
        return acc;
      }, {});

      setFundedProjects(Object.values(grouped));
    }

    setLoading(false);
  }

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Por favor conecta tu billetera</h1>
          <p className="text-gray-600">Necesitas conectar tu billetera para ver tu perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            ← Volver al inicio
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h1>

            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                {selectedAccount.meta.name?.charAt(0).toUpperCase() || 'U'}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedAccount.meta.name || 'Usuario'}
                </h2>
                <p className="text-sm font-mono text-gray-500 mb-3">{formatAddress(selectedAccount.address)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Saldos de Billetera</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">DOT</p>
                <p className="text-2xl font-bold text-gray-900">{polkadotBalance.toFixed(4)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">USDT</p>
                <p className="text-2xl font-bold text-gray-900">{assetHubBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Mis Proyectos Creados</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando...</p>
              </div>
            ) : createdProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No has creado proyectos aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {createdProjects.map((project) => {
                  const percentage = Math.min((project.current_funding / project.goal_amount) * 100, 100);
                  return (
                    <Link 
                      key={project.id} 
                      href={`/project/${project.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Meta: ${project.goal_amount.toFixed(2)} USDT</span>
                            <span>Recaudado: ${project.current_funding.toFixed(2)} USDT</span>
                            <span className="capitalize px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              {project.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700">
                            {percentage.toFixed(0)}%
                          </div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-purple-600 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Proyectos que he Fondeado</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando...</p>
              </div>
            ) : fundedProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No has fondeado proyectos aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fundedProjects.map((investment: any) => (
                  <Link 
                    key={investment.project_id} 
                    href={`/project/${investment.project_id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{investment.project?.title || 'Proyecto'}</h3>
                        <p className="text-sm text-gray-600">Tu inversión</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">${investment.amount.toFixed(2)} USDT</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
