'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EntradaMasivaBoletos({ eventoId, onClose, onSuccess }) {
  const [sucursales, setSucursales] = useState([]);
  const [boletos, setBoletos] = useState([]);
  const [currentRow, setCurrentRow] = useState({
    localizador: '',
    zona: '',
    seccion: '',
    fila: '',
    asiento: '',
    sucursal_id: '',
    estatus: 'PENDIENTE'
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSucursales();
  }, []);

  async function loadSucursales() {
    try {
      const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setSucursales(data || []);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  }

  function handleAddRow() {
    if (!currentRow.localizador || !currentRow.zona || !currentRow.sucursal_id) {
      alert('Completa al menos: Localizador, Zona y Sucursal');
      return;
    }

    setBoletos([...boletos, { ...currentRow, id: Date.now() }]);
    
    setCurrentRow({
      localizador: '',
      zona: '',
      seccion: '',
      fila: '',
      asiento: '',
      sucursal_id: currentRow.sucursal_id,
      estatus: 'PENDIENTE'
    });
  }

  function handleRemoveRow(id) {
    setBoletos(boletos.filter(b => b.id !== id));
  }

  async function handleSaveAll() {
    if (boletos.length === 0) {
      alert('Agrega al menos un boleto');
      return;
    }

    try {
      const boletosData = boletos.map(b => ({
        evento_id: eventoId,
        localizador: b.localizador,
        zona: b.zona,
        seccion: b.seccion || null,
        fila: b.fila || null,
        asiento: b.asiento || null,
        sucursal_id: b.sucursal_id,
        estatus: b.estatus
      }));

      const { error } = await supabase
        .from('boletos')
        .insert(boletosData);

      if (error) throw error;

      alert(`${boletos.length} boletos agregados correctamente`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error guardando boletos:', error);
      alert('Error al guardar boletos: ' + error.message);
    }
  }

  const boletosPorSucursal = boletos.reduce((acc, b) => {
    const suc = sucursales.find(s => s.id === b.sucursal_id)?.nombre || b.sucursal_id;
    acc[suc] = (acc[suc] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-yellow-400 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-black border-b-2 border-yellow-400 p-6">
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">
            📋 Entrada Masiva de Boletos
          </h2>
          <p className="text-gray-400">
            Agrega múltiples boletos de forma rápida - {boletos.length} boletos en lista
          </p>
        </div>

        <div className="bg-gray-800 border-b-2 border-gray-700 p-4">
          <div className="grid grid-cols-7 gap-3">
            <input
              type="text"
              placeholder="Localizador *"
              value={currentRow.localizador}
              onChange={(e) => setCurrentRow({ ...currentRow, localizador: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRow()}
              className="bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm"
              autoFocus
            />
            
            <input
              type="text"
              placeholder="Zona *"
              value={currentRow.zona}
              onChange={(e) => setCurrentRow({ ...currentRow, zona: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRow()}
              className="bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm"
            />
            
            <input
              type="text"
              placeholder="Sección"
              value={currentRow.seccion}
              onChange={(e) => setCurrentRow({ ...currentRow, seccion: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRow()}
              className="bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm"
            />
            
            <input
              type="text"
              placeholder="Fila"
              value={currentRow.fila}
              onChange={(e) => setCurrentRow({ ...currentRow, fila: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRow()}
              className="bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm"
            />
            
            <input
              type="text"
              placeholder="Asiento"
              value={currentRow.asiento}
              onChange={(e) => setCurrentRow({ ...currentRow, asiento: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRow()}
              className="bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm"
            />
            
            <select
              value={currentRow.sucursal_id}
              onChange={(e) => setCurrentRow({ ...currentRow, sucursal_id: e.target.value })}
              className="bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm"
            >
              <option value="">Sucursal *</option>
              {sucursales.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleAddRow}
              className="bg-green-500 text-white px-4 py-2 font-bold hover:bg-green-600 text-sm"
            >
              + Agregar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Presiona ENTER para agregar rápidamente
          </p>
        </div>

        {boletos.length > 0 && (
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex flex-wrap gap-3">
              {Object.entries(boletosPorSucursal).map(([suc, count]) => (
                <div key={suc} className="bg-black border border-yellow-400 px-3 py-1 text-sm">
                  <span className="text-yellow-400 font-bold">{suc}</span>
                  <span className="text-white ml-2">({count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {boletos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📝</div>
              <p>Comienza a agregar boletos usando el formulario arriba</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-black sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-yellow-400">#</th>
                  <th className="px-3 py-2 text-left text-yellow-400">Localizador</th>
                  <th className="px-3 py-2 text-left text-yellow-400">Zona</th>
                  <th className="px-3 py-2 text-left text-yellow-400">Sección</th>
                  <th className="px-3 py-2 text-left text-yellow-400">Fila</th>
                  <th className="px-3 py-2 text-left text-yellow-400">Asiento</th>
                  <th className="px-3 py-2 text-left text-yellow-400">Sucursal</th>
                  <th className="px-3 py-2 text-center text-yellow-400">Acción</th>
                </tr>
              </thead>
              <tbody>
                {boletos.map((boleto, index) => (
                  <tr key={boleto.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                    <td className="px-3 py-2 text-yellow-400 font-bold">{boleto.localizador}</td>
                    <td className="px-3 py-2 text-white">{boleto.zona}</td>
                    <td className="px-3 py-2 text-gray-300">{boleto.seccion || '-'}</td>
                    <td className="px-3 py-2 text-gray-300">{boleto.fila || '-'}</td>
                    <td className="px-3 py-2 text-gray-300">{boleto.asiento || '-'}</td>
                    <td className="px-3 py-2 text-white">
                      {sucursales.find(s => s.id === boleto.sucursal_id)?.nombre || boleto.sucursal_id}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(boleto.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-black border-t-2 border-yellow-400 p-6 flex justify-between items-center">
          <div className="text-white">
            <span className="font-bold text-xl">{boletos.length}</span>
            <span className="text-gray-400 ml-2">boletos listos para guardar</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="bg-gray-700 text-white px-6 py-3 font-bold hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAll}
              disabled={boletos.length === 0}
              className="bg-yellow-400 text-black px-8 py-3 font-bold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💾 Guardar {boletos.length} Boletos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
