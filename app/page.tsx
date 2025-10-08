'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';

export default function Home() {
  const { isConnected } = useWallet();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            El Futuro de los Préstamos entre Personas
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Invierte en proyectos creativos y ayuda a hacerlos realidad. Gana intereses mientras apoyas sueños.
          </p>
        </div>

        {/* Action Cards (shown after wallet connection) */}
        {isConnected && (
          <div className="mb-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4 text-center">Comienza Ahora</h3>
            <p className="text-center mb-6 text-purple-100">Elige lo que quieres hacer</p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => router.push('/projects')}
                className="bg-white text-gray-900 p-8 rounded-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-4">💰</div>
                <h4 className="text-2xl font-bold mb-2">Invertir en Proyectos</h4>
                <p className="text-gray-600">
                  Busca proyectos interesantes y gana dinero apoyando a creativos
                </p>
                <div className="mt-4 text-purple-600 font-semibold">
                  Ver Proyectos →
                </div>
              </button>

              <button
                onClick={() => router.push('/create-project')}
                className="bg-white text-gray-900 p-8 rounded-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-4">🚀</div>
                <h4 className="text-2xl font-bold mb-2">Pedir Financiamiento</h4>
                <p className="text-gray-600">
                  Crea tu proyecto y consigue el dinero que necesitas para tu sueño
                </p>
                <div className="mt-4 text-green-600 font-semibold">
                  Crear Proyecto →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Example Section - Animated Short */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-16 border-2 border-purple-200">
          <h3 className="text-3xl font-bold text-center mb-8 text-gray-900">¿Cómo Funciona?</h3>
          
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="text-5xl mr-4">🎬</div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Ejemplo: María y su Cortometraje Animado</h4>
                <p className="text-gray-600">María quiere producir un cortometraje animado profesional</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start p-4 bg-purple-50 rounded-lg">
                <span className="text-2xl mr-3">💡</span>
                <div>
                  <p className="font-semibold text-gray-900">María necesita: $500 USD</p>
                  <p className="text-sm text-gray-600">Para animación, voces, música y post-producción</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                <span className="text-2xl mr-3">📤</span>
                <div>
                  <p className="font-semibold text-gray-900">María sube su proyecto a Bochica</p>
                  <p className="text-sm text-gray-600">Con detalles del corto y plan de producción</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-green-50 rounded-lg">
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <p className="font-semibold text-gray-900">Tú y otros inversores aportan dinero</p>
                  <p className="text-sm text-gray-600">Entre todos completan los $500 USD que María necesita</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
                <span className="text-2xl mr-3">🎨</span>
                <div>
                  <p className="font-semibold text-gray-900">María produce su cortometraje</p>
                  <p className="text-sm text-gray-600">Usa el dinero para crear su obra maestra</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                <span className="text-2xl mr-3">💰</span>
                <div>
                  <p className="font-semibold text-gray-900">María devuelve el dinero + 10% de interés en 30 días</p>
                  <p className="text-sm text-gray-600">Si invertiste $500, recibes $550 de vuelta</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-green-100 rounded-lg border-2 border-green-300">
                <span className="text-2xl mr-3">✨</span>
                <div>
                  <p className="font-semibold text-gray-900">¡Tú ganas dinero ayudando creativos!</p>
                  <p className="text-sm text-gray-600">María logró su sueño y tú ganaste intereses</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three Simple Steps */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-10 text-gray-900">Tres Pasos Simples</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-purple-200 text-center">
              <div className="text-5xl mb-4">👀</div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">1. Elige un Proyecto</h4>
              <p className="text-gray-600">
                Mira proyectos que te gusten y revisa cuánto dinero necesitan
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-green-200 text-center">
              <div className="text-5xl mb-4">💸</div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">2. Invierte tu Dinero</h4>
              <p className="text-gray-600">
                Envía USDT de forma segura usando tu billetera digital
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-blue-200 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">3. Recibe tu Dinero + Intereses</h4>
              <p className="text-gray-600">
                Cuando el creador pague, recibes tu inversión más las ganancias
              </p>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-10 mb-16 text-white">
          <h3 className="text-3xl font-bold text-center mb-8">¿Por Qué Bochica?</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start">
              <span className="text-3xl mr-4">✓</span>
              <div>
                <p className="font-semibold text-lg">Sin bancos ni complicaciones</p>
                <p className="text-purple-100">Todo es directo entre tú y el creador</p>
              </div>
            </div>

            <div className="flex items-start">
              <span className="text-3xl mr-4">✓</span>
              <div>
                <p className="font-semibold text-lg">Tu dinero está protegido en blockchain</p>
                <p className="text-purple-100">Tecnología segura y transparente</p>
              </div>
            </div>

            <div className="flex items-start">
              <span className="text-3xl mr-4">✓</span>
              <div>
                <p className="font-semibold text-lg">Ganas 5-15% de interés</p>
                <p className="text-purple-100">Mejor que un banco tradicional</p>
              </div>
            </div>

            <div className="flex items-start">
              <span className="text-3xl mr-4">✓</span>
              <div>
                <p className="font-semibold text-lg">Ayudas a personas con sueños</p>
                <p className="text-purple-100">Apoyas talento y creatividad real</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isConnected ? (
          <div className="text-center bg-purple-50 rounded-lg p-12 border border-purple-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">¿Listo para Comenzar?</h3>
            <p className="text-gray-600 mb-6">Conecta tu billetera Talisman para empezar a invertir o crear proyectos</p>
            <div className="text-sm text-gray-500">
              Haz clic en "Conectar Billetera" arriba
            </div>
          </div>
        ) : null}

        {/* Platform Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">2%</div>
            <div className="text-gray-600 mt-2">Comisión de Plataforma</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">5-15%</div>
            <div className="text-gray-600 mt-2">Intereses para Inversores</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">24h-7d</div>
            <div className="text-gray-600 mt-2">Opciones de Plazo</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>Diseñado, Conceptualizado y creado por Francisco Cordoba Otalora</p>
          <p className="mt-2 text-sm">Bochica - Plataforma de Micro-Préstamos Descentralizada</p>
        </div>
      </footer>
    </div>
  );
}
