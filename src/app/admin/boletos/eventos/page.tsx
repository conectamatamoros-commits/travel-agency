'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import EntradaMasivaBoletos from './EntradaMasivaBoletos';

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [boletos, setBoletos] = useState([]);
  
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [showEntradaMasiva, setShowEntradaMasiva] = useState(false);
  
  const [eventoForm, setEventoForm] = useState({ nombre: '', fecha_evento: '', ciudad: '', venue: '' });
  const [boletoForm, setBoletoForm] = useState({
    localizador: '',
    zona: '',
    seccion: '',
    fila: '',
    asiento: '',
    sucursal_id: '',
    correo: '',
    estatus: 'PENDIENTE'
  });
  const [editingBoleto, setEditingBoleto] = useState(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadEventos();
    loadSucursales();
  }, []);

  async function loadEventos() {
    try {
      const { data, error } = await supabase
        .from('eventos_boletos')
        .select(`
          *,
          boletos (count)
        `)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  }

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

  async function loadBoletos(eventoId) {
    try {
      const { data, error } = await supabase
        .from('boletos')
        .select(`
          *,
          sucursales (nombre)
        `)
        .eq('evento_id', eventoId)
        .order('sucursal_id', { ascending: true });

      if (error) throw error;
      setBoletos(data || []);
    } catch (error) {
      console.error('Error cargando boletos:', error);
    }
  }

  async function handleSelectEvento(evento) {
    setSelectedEvento(evento);
    await loadBoletos(evento.id);
  }

  async function handleSaveEvento(e) {
    e.preventDefault();
    try {
      if (eventoForm.id) {
        const { error } = await supabase
          .from('eventos_boletos')
          .update(eventoForm)
          .eq('id', eventoForm.id);
        if (error) throw error;
        alert('Evento actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('eventos_boletos')
          .insert([eventoForm]);
        if (error) throw error;
        alert('Evento creado correctamente');
      }
      
      setShowEventoModal(false);
      setEventoForm({ nombre: '', fecha_evento: '', ciudad: '', venue: '' });
      loadEventos();
    } catch (error) {
      console.error('Error guardando evento:', error);
      alert('Error al guardar el evento: ' + error.message);
    }
  }

  async function handleDeleteEvento(eventoId) {
    if (!confirm('¿Estás seguro de eliminar este evento y todos sus boletos?')) return;
    
    try {
      const { error } = await supabase
        .from('eventos_boletos')
        .delete()
        .eq('id', eventoId);
      
      if (error) throw error;
      alert('Evento eliminado correctamente');
      setSelectedEvento(null);
      setBoletos([]);
      loadEventos();
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('Error al eliminar el evento');
    }
  }

  async function handleSaveBoleto(e) {
    e.preventDefault();
    try {
      const boletoData = {
        ...boletoForm,
        evento_id: selectedEvento.id
      };

      if (editingBoleto) {
        const { error } = await supabase
          .from('boletos')
          .update(boletoData)
          .eq('id', editingBoleto.id);
        if (error) throw error;
        alert('Boleto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('boletos')
          .insert([boletoData]);
        if (error) throw error;
        alert('Boleto creado correctamente');
      }

      setShowBoletoModal(false);
      setBoletoForm({
        localizador: '',
        zona: '',
        seccion: '',
        fila: '',
        asiento: '',
        sucursal_id: '',
        correo: '',
        estatus: 'PENDIENTE'
      });
      setEditingBoleto(null);
      loadBoletos(selectedEvento.id);
    } catch (error) {
      console.error('Error guardando boleto:', error);
      alert('Error al guardar el boleto: ' + error.message);
    }
  }

  async function handleDeleteBoleto(boletoId) {
    if (!confirm('¿Estás seguro de eliminar este boleto?')) return;
    
    try {
      const { error } = await supabase
        .from('boletos')
        .delete()
        .eq('id', boletoId);
      
      if (error) throw error;
      alert('Boleto eliminado correctamente');
      loadBoletos(selectedEvento.id);
    } catch (error) {
      console.error('Error eliminando boleto:', error);
      alert('Error al eliminar el boleto');
    }
  }

  async function updateEstatusBoleto(boletoId, nuevoEstatus) {
    try {
      const { error } = await supabase
        .from('boletos')
        .update({ estatus: nuevoEstatus })
        .eq('id', boletoId);

      if (error) throw error;
      setBoletos(boletos.map(b => 
        b.id === boletoId ? { ...b, estatus: nuevoEstatus } : b
      ));
    } catch (error) {
      console.error('Error actualizando estatus:', error);
      alert('Error al actualizar el estatus');
    }
  }

  function openEditBoleto(boleto) {
    setEditingBoleto(boleto);
    setBoletoForm({
      localizador: boleto.localizador,
      zona: boleto.zona,
      seccion: boleto.seccion || '',
      fila: boleto.fila || '',
      asiento: boleto.asiento || '',
      sucursal_id: boleto.sucursal_id,
      correo: boleto.correo || '',
      estatus: boleto.estatus || 'PENDIENTE'
    });
    setShowBoletoModal(true);
  }

  const eventosFiltrados = eventos.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Link 
            href="/admin/boletos"
            className="text-yellow-400 hover:text-yellow-300 mb-2 inline-block"
          >
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white">
            🎤 Gestión de Eventos
          </h1>
          <p className="text-gray-400 mt-2">
            {eventos.length} eventos totales
          </p>
        </div>
        <button
          onClick={() => {
            setEventoForm({ nombre: '', fecha_evento: '', ciudad: '', venue: '' });
            setShowEventoModal(true);
          }}
          className="bg-yellow-400 text-black px-6 py-3 font-bold hover:bg-yellow-300 transition-colors"
        >
          + Nuevo Evento
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar evento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 focus:border-yellow-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {eventosFiltrados.map((evento) => (
            <div
              key={evento.id}
              className={`bg-gray-900 border-2 p-4 transition-all ${
                selectedEvento?.id === evento.id
                  ? 'border-yellow-400 bg-gray-800'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSelectEvento(evento)}
                >
                  <h3 className="font-bold text-white text-lg mb-1">
                    {evento.nombre}
                  </h3>
                  <div className="text-sm text-gray-400">
                    {evento.boletos?.[0]?.count || 0} boletos
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEventoForm(evento);
                      setShowEventoModal(true);
                    }}
                    className="text-yellow-400 hover:text-yellow-300 text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteEvento(evento.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border-2 border-gray-800 p-6 sticky top-6 max-h-[calc(100vh-150px)] overflow-y-auto">
          {selectedEvento ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">
                  {selectedEvento.nombre}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEntradaMasiva(true)}
                    className="bg-yellow-400 text-black px-4 py-2 text-sm font-bold hover:bg-yellow-300"
                  >
                    📋 Entrada Masiva
                  </button>
                  <button
                    onClick={() => {
                      setBoletoForm({
                        localizador: '',
                        zona: '',
                        seccion: '',
                        fila: '',
                        asiento: '',
                        sucursal_id: '',
                        correo: '',
                        estatus: 'PENDIENTE'
                      });
                      setEditingBoleto(null);
                      setShowBoletoModal(true);
                    }}
                    className="bg-green-500 text-white px-4 py-2 text-sm font-bold hover:bg-green-600"
                  >
                    + Agregar Boleto
                  </button>
                </div>
              </div>

              {boletos.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No hay boletos para este evento
                </p>
              ) : (
                <div className="space-y-3">
                  {boletos.map((boleto) => (
                    <div
                      key={boleto.id}
                      className="bg-black border border-gray-800 p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-yellow-400 font-bold mb-1">
                            {boleto.localizador}
                          </div>
                          <div className="text-white text-sm">
                            {boleto.zona}
                          </div>
                          {boleto.seccion && (
                            <div className="text-gray-400 text-xs">
                              Sección: {boleto.seccion}
                            </div>
                          )}
                          {boleto.fila && boleto.asiento && (
                            <div className="text-gray-400 text-xs">
                              Fila {boleto.fila}, Asiento {boleto.asiento}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <select
                            value={boleto.estatus || 'PENDIENTE'}
                            onChange={(e) => updateEstatusBoleto(boleto.id, e.target.value)}
                            className={`px-3 py-1 text-xs font-bold ${
                              boleto.estatus?.toUpperCase().includes('ENVIADO')
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="ENVIADO">ENVIADO</option>
                          </select>
                          <button
                            onClick={() => openEditBoleto(boleto)}
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteBoleto(boleto.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-800 pt-2 mt-2">
                        <div className="text-white text-sm font-medium">
                          📍 {boleto.sucursales?.nombre || boleto.sucursal_id}
                        </div>
                        {boleto.correo && (
                          <div className="text-gray-400 text-xs mt-1">
                            📧 {boleto.correo}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🎫</div>
              <p>Selecciona un evento para ver sus boletos</p>
            </div>
          )}
        </div>
      </div>

      {showEventoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-yellow-400 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              {eventoForm.id ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
            
            <form onSubmit={handleSaveEvento}>
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-bold">Nombre del Evento *</label>
                  <input
                    type="text"
                    value={eventoForm.nombre}
                    onChange={(e) => setEventoForm({ ...eventoForm, nombre: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                    placeholder="Ej: Bad Bunny - Monterrey 2026"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2 font-bold">Fecha del Evento</label>
                    <input
                      type="date"
                      value={eventoForm.fecha_evento || ''}
                      onChange={(e) => setEventoForm({ ...eventoForm, fecha_evento: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-bold">Ciudad</label>
                    <input
                      type="text"
                      value={eventoForm.ciudad || ''}
                      onChange={(e) => setEventoForm({ ...eventoForm, ciudad: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                      placeholder="Ej: Monterrey"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2 font-bold">Venue/Lugar</label>
                  <input
                    type="text"
                    value={eventoForm.venue || ''}
                    onChange={(e) => setEventoForm({ ...eventoForm, venue: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                    placeholder="Ej: Estadio BBVA"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-400 text-black py-3 font-bold hover:bg-yellow-300"
                >
                  {eventoForm.id ? 'Actualizar' : 'Crear'} Evento
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventoModal(false);
                    setEventoForm({ nombre: '', fecha_evento: '', ciudad: '', venue: '' });
                  }}
                  className="flex-1 bg-gray-700 text-white py-3 font-bold hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBoletoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-yellow-400 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              {editingBoleto ? 'Editar Boleto' : 'Nuevo Boleto'}
            </h2>
            
            <form onSubmit={handleSaveBoleto}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2 font-bold">Localizador *</label>
                    <input
                      type="text"
                      value={boletoForm.localizador}
                      onChange={(e) => setBoletoForm({ ...boletoForm, localizador: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                      placeholder="Ej: 5-12345"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-bold">Zona *</label>
                    <input
                      type="text"
                      value={boletoForm.zona}
                      onChange={(e) => setBoletoForm({ ...boletoForm, zona: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                      placeholder="Ej: PLATINO A"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white mb-2 font-bold">Sección</label>
                    <input
                      type="text"
                      value={boletoForm.seccion}
                      onChange={(e) => setBoletoForm({ ...boletoForm, seccion: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                      placeholder="Ej: PLAT 02"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-bold">Fila</label>
                    <input
                      type="text"
                      value={boletoForm.fila}
                      onChange={(e) => setBoletoForm({ ...boletoForm, fila: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                      placeholder="Ej: 3"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-bold">Asiento</label>
                    <input
                      type="text"
                      value={boletoForm.asiento}
                      onChange={(e) => setBoletoForm({ ...boletoForm, asiento: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                      placeholder="Ej: 15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2 font-bold">Sucursal *</label>
                  <select
                    value={boletoForm.sucursal_id}
                    onChange={(e) => setBoletoForm({ ...boletoForm, sucursal_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                    required
                  >
                    <option value="">Selecciona una sucursal...</option>
                    {sucursales.map((suc) => (
                      <option key={suc.id} value={suc.id}>
                        {suc.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2 font-bold">Correo</label>
                  <input
                    type="email"
                    value={boletoForm.correo}
                    onChange={(e) => setBoletoForm({ ...boletoForm, correo: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-bold">Estatus</label>
                  <select
                    value={boletoForm.estatus}
                    onChange={(e) => setBoletoForm({ ...boletoForm, estatus: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="ENVIADO">ENVIADO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-400 text-black py-3 font-bold hover:bg-yellow-300"
                >
                  {editingBoleto ? 'Actualizar' : 'Crear'} Boleto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBoletoModal(false);
                    setBoletoForm({
                      localizador: '',
                      zona: '',
                      seccion: '',
                      fila: '',
                      asiento: '',
                      sucursal_id: '',
                      correo: '',
                      estatus: 'PENDIENTE'
                    });
                    setEditingBoleto(null);
                  }}
                  className="flex-1 bg-gray-700 text-white py-3 font-bold hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEntradaMasiva && selectedEvento && (
        <EntradaMasivaBoletos
          eventoId={selectedEvento.id}
          onClose={() => setShowEntradaMasiva(false)}
          onSuccess={() => {
            loadBoletos(selectedEvento.id);
            loadEventos();
          }}
        />
      )}
    </div>
  );
}
