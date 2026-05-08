'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [boletos, setBoletos] = useState([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSucursales();
  }, []);

  async function loadSucursales() {
    try {
      const { data, error } = await supabase
        .from('sucursales')
        .select(`
          *,
          boletos (count)
        `)
        .order('nombre', { ascending: true });

      if (error) throw error;

      const sucursalesConStats = await Promise.all(
        (data || []).map(async (suc) => {
          const { count: totalBoletos } = await supabase
            .from('boletos')
            .select('*', { count: 'exact', head: true })
            .eq('sucursal_id', suc.id);

          const { count: enviados } = await supabase
            .from('boletos')
            .select('*', { count: 'exact', head: true })
            .eq('sucursal_id', suc.id)
            .or('estatus.eq.ENVIADO,estatus.eq.ENVIADOS');

          return {
            ...suc,
            totalBoletos: totalBoletos || 0,
            enviados: enviados || 0,
            pendientes: (totalBoletos || 0) - (enviados || 0)
          };
        })
      );

      setSucursales(sucursalesConStats);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBoletosSucursal(sucursalId) {
    try {
      const { data, error } = await supabase
        .from('boletos')
        .select(`
          *,
          eventos_boletos (nombre)
        `)
        .eq('sucursal_id', sucursalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoletos(data || []);
    } catch (error) {
      console.error('Error cargando boletos:', error);
    }
  }

  async function handleSelectSucursal(sucursal) {
    setSelectedSucursal(sucursal);
    await loadBoletosSucursal(sucursal.id);
  }

  const sucursalesFiltradas = sucursales.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/boletos"
          className="text-yellow-400 hover:text-yellow-300 mb-2 inline-block"
        >
          ← Volver al Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white">
          📍 Por Sucursal
        </h1>
        <p className="text-gray-400 mt-2">
          {sucursales.length} sucursales/agencias
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 focus:border-yellow-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {sucursalesFiltradas.map((sucursal) => {
            const porcentaje = sucursal.totalBoletos > 0
              ? Math.round((sucursal.enviados / sucursal.totalBoletos) * 100)
              : 0;

            return (
              <div
                key={sucursal.id}
                onClick={() => handleSelectSucursal(sucursal)}
                className={`bg-gray-900 border-2 p-4 cursor-pointer transition-all ${
                  selectedSucursal?.id === sucursal.id
                    ? 'border-yellow-400 bg-gray-800'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">
                      {sucursal.nombre}
                    </h3>
                    {sucursal.correo && (
                      <div className="text-sm text-gray-400">
                        📧 {sucursal.correo}
                      </div>
                    )}
                  </div>
                  <div className="text-yellow-400 text-2xl">
                    →
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white ml-1 font-bold">
                      {sucursal.totalBoletos}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Enviados:</span>
                    <span className="text-green-500 ml-1 font-bold">
                      {sucursal.enviados}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Pendientes:</span>
                    <span className="text-red-500 ml-1 font-bold">
                      {sucursal.pendientes}
                    </span>
                  </div>
                </div>

                <div className="mt-3 bg-gray-800 h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-900 border-2 border-gray-800 p-6 sticky top-6 max-h-[calc(100vh-150px)] overflow-y-auto">
          {selectedSucursal ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                  {selectedSucursal.nombre}
                </h2>
                {selectedSucursal.correo && (
                  <a 
                    href={`mailto:${selectedSucursal.correo}`}
                    className="text-gray-400 hover:text-yellow-400 text-sm"
                  >
                    📧 {selectedSucursal.correo}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-black border border-gray-800 p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {selectedSucursal.totalBoletos}
                  </div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
                <div className="bg-black border border-green-500 p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {selectedSucursal.enviados}
                  </div>
                  <div className="text-xs text-gray-400">Enviados</div>
                </div>
                <div className="bg-black border border-red-500 p-3 text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {selectedSucursal.pendientes}
                  </div>
                  <div className="text-xs text-gray-400">Pendientes</div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">
                Boletos ({boletos.length})
              </h3>

              {boletos.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No hay boletos asignados
                </p>
              ) : (
                <div className="space-y-3">
                  {boletos.map((boleto) => (
                    <div
                      key={boleto.id}
                      className="bg-black border border-gray-800 p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-yellow-400 font-bold text-sm">
                            {boleto.eventos_boletos?.nombre || 'Sin evento'}
                          </div>
                          <div className="text-white text-xs mt-1">
                            🎫 {boleto.localizador}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {boleto.zona}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 text-xs font-bold ${
                            boleto.estatus?.toUpperCase().includes('ENVIADO')
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {boleto.estatus || 'PENDIENTE'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📍</div>
              <p>Selecciona una sucursal para ver sus boletos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
