'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function EstadisticasPage() {
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadEstadisticas();
  }, []);

  async function loadEstadisticas() {
    try {
      const { data: sucursales, error: sucError } = await supabase
        .from('sucursales')
        .select('*')
        .order('nombre', { ascending: true });

      if (sucError) throw sucError;

      const stats = await Promise.all(
        (sucursales || []).map(async (suc) => {
          const { count: total } = await supabase
            .from('boletos')
            .select('*', { count: 'exact', head: true })
            .eq('sucursal_id', suc.id);

          const { count: enviados } = await supabase
            .from('boletos')
            .select('*', { count: 'exact', head: true })
            .eq('sucursal_id', suc.id)
            .or('estatus.eq.ENVIADO,estatus.eq.ENVIADOS');

          const porcentaje = total > 0 ? Math.round((enviados / total) * 100) : 0;

          return {
            sucursal: suc.nombre,
            correo: suc.correo,
            total: total || 0,
            enviados: enviados || 0,
            pendientes: (total || 0) - (enviados || 0),
            porcentaje
          };
        })
      );

      stats.sort((a, b) => b.porcentaje - a.porcentaje);
      setEstadisticas(stats);
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

  const totales = estadisticas.reduce(
    (acc, stat) => ({
      total: acc.total + stat.total,
      enviados: acc.enviados + stat.enviados,
      pendientes: acc.pendientes + stat.pendientes
    }),
    { total: 0, enviados: 0, pendientes: 0 }
  );

  const promedioGlobal = totales.total > 0
    ? Math.round((totales.enviados / totales.total) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/boletos"
          className="text-yellow-400 hover:text-yellow-300 mb-2 inline-block"
        >
          ← Volver al Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">
          📊 Estadísticas
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border-2 border-yellow-400 p-6">
          <div className="text-gray-400 text-sm mb-2">Total de Boletos</div>
          <div className="text-4xl font-bold text-white">
            {totales.total}
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-green-500 p-6">
          <div className="text-gray-400 text-sm mb-2">Enviados</div>
          <div className="text-4xl font-bold text-green-500">
            {totales.enviados}
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-red-500 p-6">
          <div className="text-gray-400 text-sm mb-2">Pendientes</div>
          <div className="text-4xl font-bold text-red-500">
            {totales.pendientes}
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-yellow-400 p-6">
          <div className="text-gray-400 text-sm mb-2">Progreso Global</div>
          <div className="text-4xl font-bold text-yellow-400">
            {promedioGlobal}%
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border-2 border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Sucursal
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Correo
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Enviados
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Pendientes
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  % Completado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Progreso
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {estadisticas.map((stat, index) => (
                <tr 
                  key={stat.sucursal}
                  className="hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-white">
                      {stat.sucursal}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">
                      {stat.correo || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-bold text-white">
                      {stat.total}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-bold text-green-500">
                      {stat.enviados}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-bold text-red-500">
                      {stat.pendientes}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className={`text-sm font-bold ${
                      stat.porcentaje === 100 ? 'text-green-500' :
                      stat.porcentaje >= 50 ? 'text-yellow-400' :
                      'text-red-500'
                    }`}>
                      {stat.porcentaje}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-32 bg-gray-800 h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          stat.porcentaje === 100 ? 'bg-green-500' :
                          stat.porcentaje >= 50 ? 'bg-yellow-400' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${stat.porcentaje}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-black">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-bold text-yellow-400">
                  TOTALES
                </td>
                <td className="px-6 py-4 text-center text-sm font-bold text-white">
                  {totales.total}
                </td>
                <td className="px-6 py-4 text-center text-sm font-bold text-green-500">
                  {totales.enviados}
                </td>
                <td className="px-6 py-4 text-center text-sm font-bold text-red-500">
                  {totales.pendientes}
                </td>
                <td className="px-6 py-4 text-center text-sm font-bold text-yellow-400">
                  {promedioGlobal}%
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
