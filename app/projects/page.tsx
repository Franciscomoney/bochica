'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';
import { calculateFundingPercentage } from '@/lib/financial';

export default function ProjectsPage() {
  const { isConnected } = useWallet();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');

      // Build query based on filter
      let query = supabase.from('projects').select('*');

      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'funded') {
        query = query.eq('status', 'funded');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error:', error);
      setProjects([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Explorar Proyectos</h1>
          <p className="text-gray-600">Invierte en proyectos y ayuda a emprendedores a alcanzar sus metas</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todos los Proyectos
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilter('funded')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'funded'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completamente Fondeados
          </button>
        </div>

        {/* Projects Grid - Kickstarter Style */}
        {projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => {
              const progress = calculateFundingPercentage(project.current_funding, project.goal_amount);
              const isFullyFunded = progress >= 100;

              return (
                <Link key={project.id} href={`/project/${project.id}`} className="group">
                  <div className="bg-white overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Project Image Placeholder */}
                    <div className="w-full h-64 bg-gradient-to-br from-purple-400 to-purple-600 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-white text-6xl font-bold opacity-20">
                        {project.title.charAt(0)}
                      </div>
                      {isFullyFunded && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">
                          FUNDED
                        </div>
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                      {/* Stats */}
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          ${project.current_funding.toLocaleString()}
                        </p>
                        <div className="flex items-center text-xs text-gray-600 space-x-3">
                          <span>recaudados de ${project.goal_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isFullyFunded ? 'bg-green-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>

                      {/* Creator */}
                      <p className="text-xs text-gray-500">
                        By {project.creator_address.slice(0, 8)}...{project.creator_address.slice(-6)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Se Encontraron Proyectos</h3>
            <p className="text-gray-600 mb-6">¡Sé el primero en crear un proyecto de financiamiento!</p>
            <Link
              href="/create-project"
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Crear Tu Proyecto
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
