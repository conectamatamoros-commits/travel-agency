'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function BoletosPage() {
  const [stats, setStats] = useState({
    totalBoletos: 0,
    enviados: 0,
    pendientes: 0,
    totalEventos: 0,
    totalSucursales: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { count: totalBoletos } = await supabase
        .from('boletos')
        .select('*', { count: 'exact', head: true });

      const { count: enviados } = await supabase
        .from('boletos')
        .select('*', { count: 'exact', head: true })
        .or('estatus.eq.ENVIADO,estatus.eq.ENVIADOS');

      const { count: pendientes } = await supabase
        .from('boletos')
        .select('*', { count: 'exact', head: true })
        .or('estatus.eq.PENDIENTE,estatus.eq.PENDIENTES');

      const { count: totalEventos } = await supabase
        .from('eventos_boletos')
        .select('*', { count: 'exact', head: true });

      const { count: totalSucursales } = await supabase
        .from('sucursales')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalBoletos: totalBoletos || 0,
        enviados: enviados || 0,
        pendientes: pendientes || 0,
        totalEventos: totalEventos || 0,
        totalSucursales: totalSucursales || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const porcentajeEnviados = stats.totalBoletos > 0 
    ? Math.round((stats.enviados / stats.totalBoletos) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          🎫 Sistema de Boletos
        </h1>
        <p className="text-gray-400">
          Gestión de boletos por evento y sucursal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border-2 border-gray-800 p-6 hover:border-yellow-400 transition-colors">
          <div className="text-gray-400 text-sm mb-2">Total de Boletos</div>
          <div className="text-4xl font-bold text-white mb-2">
            {stats.totalBoletos}
          </div>
          <div className="text-xs text-gray-500">
            En {stats.totalEventos} eventos
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-gray-800 p-6 hover:border-green-500 transition-colors">
          <div className="text-gray-400 text-sm mb-2">Enviados</div>
          <div className="text-4xl font-bold text-green-500 mb-2">
            {stats.enviados}
          </div>
          <div className="text-xs text-gray-500">
            {porcentajeEnviados}% completado
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-gray-800 p-6 hover:border-red-500 transition-colors">
          <div className="text-gray-400 text-sm mb-2">Pendientes</div>
          <div className="text-4xl font-bold text-red-500 mb-2">
            {stats.pendientes}
          </div>
          <div className="text-xs text-gray-500">
            Por enviar
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-gray-800 p-6 hover:border-yellow-400 transition-colors">
          <div className="text-gray-400 text-sm mb-2">Sucursales</div>
          <div className="text-4xl font-bold text-white mb-2">
            {stats.totalSucursales}
          </div>
          <div className="text-xs text-gray-500">
            Agencias activas
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border-2 border-gray-800 p-6 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Progreso de Entrega</span>
          <span className="text-yellow-400 font-bold">{porcentajeEnviados}%</span>
        </div>
        <div className="w-full bg-gray-800 h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-green-500 h-full transition-all duration-500"
            style={{ width: `${porcentajeEnviados}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/admin/boletos/eventos"
          className="bg-gray-900 border-2 border-gray-800 p-8 hover:border-yellow-400 hover:scale-105 transition-all group"
        >
          <div className="text-5xl mb-4">🎤</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400">
            Gestión de Eventos
          </h3>
          <p className="text-gray-400 text-sm">
            Ver, crear y editar eventos con sus boletos
          </p>
        </Link>

        <Link 
          href="/admin/boletos/sucursales"
          className="bg-gray-900 border-2 border-gray-800 p-8 hover:border-yellow-400 hover:scale-105 transition-all group"
        >
          <div className="text-5xl mb-4">📍</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400">
            Por Sucursal
          </h3>
          <p className="text-gray-400 text-sm">
            Vista de boletos por sucursal con estadísticas
          </p>
        </Link>

        <Link 
          href="/admin/boletos/estadisticas"
          className="bg-gray-900 border-2 border-gray-800 p-8 hover:border-yellow-400 hover:scale-105 transition-all group"
        >
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400">
            Estadísticas
          </h3>
          <p className="text-gray-400 text-sm">
            Reportes y análisis detallado por sucursal
          </p>
        </Link>
      </div>
    </div>
  );
}
