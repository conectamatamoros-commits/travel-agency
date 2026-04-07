'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BedDouble, Users, Plus, X, UserPlus, AlertCircle, Check, Edit2, Trash2, Save } from 'lucide-react'

const TIPO_COLORS: Record<string, string> = {
  'Doble': 'bg-blue-50 border-blue-200',
  'DOBLE': 'bg-blue-50 border-blue-200',
  'Triple': 'bg-purple-50 border-purple-200',
  'TRIPLE': 'bg-purple-50 border-purple-200',
  'Cuadruple': 'bg-green-50 border-green-200',
  'CUADRUPLE': 'bg-green-50 border-green-200',
  'Individual': 'bg-orange-50 border-orange-200',
  'INDIVIDUAL': 'bg-orange-50 border-orange-200',
}

const TIPO_MAX: Record<string, number> = {
  'Doble': 2, 'DOBLE': 2,
  'Triple': 3, 'TRIPLE': 3,
  'Cuadruple': 4, 'CUADRUPLE': 4,
  'Individual': 1, 'INDIVIDUAL': 1,
}

const TIPOS = ['Doble', 'Triple', 'Cuadruple', 'Individual']

interface Viajero { id: string; nombre: string; talla?: string; celular?: string }
interface Asignacion { id: string; viajero_id: string; viajero: Viajero }
interface Habitacion {
  id: string; viaje_id: string; numero_cuarto: string; tipo?: string; hotel?: string; notas?: string
  asignaciones: Asignacion[]
}
interface ViajeroParcial { id: string; nombre: string; tipo_habitacion?: string; viaje_id: string }

interface Props {
  habitaciones: Habitacion[]
  viajes: { id: string; nombre: string }[]
  sinCuarto: ViajeroParcial[]
  initialViaje?: string
}

export default function CuartosClient({ habitaciones: initialHabs, viajes, sinCuarto: initialSinCuarto, initialViaje }: Props) {
  const supabase = createClient()
  const [viajeFilter, setViajeFilter] = useState(initialViaje ?? (viajes[0]?.id ?? ''))
  const [habs, setHabs] = useState(initialHabs)
  const [sinCuarto, setSinCuarto] = useState(initialSinCuarto)
  const [assigningTo, setAssigningTo] = useState<string | null>(null)
  const [selectedViajero, setSelectedViajero] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ numero_cuarto: '', tipo: '', hotel: '', notas: '' })
  const [showNewCuarto, setShowNewCuarto] = useState(false)
  const [newCuarto, setNewCuarto] = useState({ numero_cuarto: '', tipo: 'Doble' })

  const filteredHabs = useMemo(() =>
    viajeFilter ? habs.filter(h => h.viaje_id === viajeFilter) : habs,
    [habs, viajeFilter]
  )

  const filteredSin = useMemo(() =>
    viajeFilter ? sinCuarto.filter(v => v.viaje_id === viajeFilter) : sinCuarto,
    [sinCuarto, viajeFilter]
  )

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2500)
  }

  async function asignarViajero(habitacionId: string) {
    if (!selectedViajero) return
    setSaving(true)
    const { error } = await supabase.from('asignaciones_cuarto').insert({
      habitacion_id: habitacionId, viajero_id: selectedViajero,
    })
    if (!error) {
      const viajero = sinCuarto.find(v => v.id === selectedViajero)
      if (viajero) {
        setHabs(prev => prev.map(h => h.id === habitacionId ? {
          ...h,
          asignaciones: [...h.asignaciones, {
            id: Date.now().toString(), viajero_id: selectedViajero,
            viajero: { id: viajero.id, nombre: viajero.nombre }
          }]
        } : h))
        setSinCuarto(prev => prev.filter(v => v.id !== selectedViajero))
        showMsg('✅ Viajero asignado')
      }
    }
    setSelectedViajero('')
    setAssigningTo(null)
    setSaving(false)
  }

  async function removerViajero(habitacionId: string, viajeroId: string, asignacionId: string) {
    const { error } = await supabase.from('asignaciones_cuarto').delete().eq('id', asignacionId)
    if (!error) {
      const hab = habs.find(h => h.id === habitacionId)
      const asig = hab?.asignaciones.find(a => a.id === asignacionId)
      setHabs(prev => prev.map(h => h.id === habitacionId ? {
        ...h, asignaciones: h.asignaciones.filter(a => a.id !== asignacionId)
      } : h))
      if (asig) {
        setSinCuarto(prev => [...prev, {
          id: viajeroId, nombre: asig.viajero.nombre, viaje_id: hab!.viaje_id
        }])
      }
      showMsg('✅ Viajero removido del cuarto')
    }
  }

  function startEdit(hab: Habitacion) {
    setEditingId(hab.id)
    setEditForm({
      numero_cuarto: hab.numero_cuarto,
      tipo: hab.tipo ?? 'Doble',
      hotel: hab.hotel ?? '',
      notas: hab.notas ?? '',
    })
  }

  async function saveEdit(habId: string) {
    setSaving(true)
    const { error } = await supabase.from('habitaciones').update({
      numero_cuarto: editForm.numero_cuarto,
      tipo: editForm.tipo || null,
      hotel: editForm.hotel || null,
      notas: editForm.notas || null,
    }).eq('id', habId)

    if (!error) {
      setHabs(prev => prev.map(h => h.id === habId ? {
        ...h, numero_cuarto: editForm.numero_cuarto,
        tipo: editForm.tipo, hotel: editForm.hotel, notas: editForm.notas
      } : h))
      showMsg('✅ Cuarto actualizado')
    }
    setEditingId(null)
    setSaving(false)
  }

  async function deleteCuarto(hab: Habitacion) {
    if (!confirm(`¿Eliminar ${hab.numero_cuarto}? Los viajeros quedarán sin cuarto asignado.`)) return
    // Remove asignaciones first
    await supabase.from('asignaciones_cuarto').delete().eq('habitacion_id', hab.id)
    const { error } = await supabase.from('habitaciones').delete().eq('id', hab.id)
    if (!error) {
      // Return viajeros to sinCuarto
      const viajerosDeCuarto = hab.asignaciones.map(a => ({
        id: a.viajero_id, nombre: a.viajero.nombre, viaje_id: hab.viaje_id
      }))
      setSinCuarto(prev => [...prev, ...viajerosDeCuarto])
      setHabs(prev => prev.filter(h => h.id !== hab.id))
      showMsg('✅ Cuarto eliminado')
    }
  }

  async function createCuarto() {
    if (!newCuarto.numero_cuarto || !viajeFilter) return
    setSaving(true)
    const { data, error } = await supabase.from('habitaciones').insert({
      viaje_id: viajeFilter,
      numero_cuarto: newCuarto.numero_cuarto,
      tipo: newCuarto.tipo,
    }).select('*').single()

    if (!error && data) {
      setHabs(prev => [...prev, { ...data, asignaciones: [] }])
      setNewCuarto({ numero_cuarto: '', tipo: 'Doble' })
      setShowNewCuarto(false)
      showMsg('✅ Cuarto creado')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input w-64">
          <option value="">Todos los viajes</option>
          {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
        {viajeFilter && (
          <button onClick={() => setShowNewCuarto(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo cuarto
          </button>
        )}
        {msg && <span className="text-green-600 text-sm font-medium">{msg}</span>}
        <div className="ml-auto text-sm text-gray-500">
          {filteredHabs.length} cuartos · {filteredSin.length} sin asignar
        </div>
      </div>

      {/* New cuarto form */}
      {showNewCuarto && (
        <div className="card p-5 border-2 border-brand-200">
          <h3 className="font-semibold text-gray-900 mb-4">Nuevo cuarto</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Número / Nombre</label>
              <input value={newCuarto.numero_cuarto} onChange={e => setNewCuarto(p => ({...p, numero_cuarto: e.target.value}))}
                placeholder="Ej: Cuarto 5, Hab 101..." className="input" />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select value={newCuarto.tipo} onChange={e => setNewCuarto(p => ({...p, tipo: e.target.value}))} className="input">
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={createCuarto} disabled={!newCuarto.numero_cuarto || saving} className="btn-primary">
                <Save className="w-4 h-4" /> Crear
              </button>
              <button onClick={() => setShowNewCuarto(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Room grid */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {filteredHabs.length === 0 && (
            <div className="col-span-2 card p-16 text-center">
              <BedDouble className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay cuartos para este viaje</p>
              {viajeFilter && (
                <button onClick={() => setShowNewCuarto(true)} className="btn-primary mt-4">
                  <Plus className="w-4 h-4" /> Crear cuarto
                </button>
              )}
            </div>
          )}

          {filteredHabs.map(h => {
            const max = TIPO_MAX[h.tipo ?? ''] ?? 4
            const ocupados = h.asignaciones.length
            const lleno = ocupados >= max
            const colorClass = TIPO_COLORS[h.tipo ?? ''] ?? 'bg-gray-50 border-gray-200'
            const isEditing = editingId === h.id

            return (
              <div key={h.id} className={`card border-2 ${colorClass} p-4`}>
                {/* Header */}
                {isEditing ? (
                  <div className="space-y-2 mb-3">
                    <input value={editForm.numero_cuarto}
                      onChange={e => setEditForm(p => ({...p, numero_cuarto: e.target.value}))}
                      className="input text-sm font-semibold" placeholder="Nombre del cuarto" />
                    <select value={editForm.tipo} onChange={e => setEditForm(p => ({...p, tipo: e.target.value}))} className="input text-sm">
                      {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input value={editForm.hotel} onChange={e => setEditForm(p => ({...p, hotel: e.target.value}))}
                      className="input text-sm" placeholder="Hotel (opcional)" />
                    <input value={editForm.notas} onChange={e => setEditForm(p => ({...p, notas: e.target.value}))}
                      className="input text-sm" placeholder="Notas (opcional)" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(h.id)} disabled={saving} className="btn-primary text-xs py-1 flex-1">
                        <Save className="w-3 h-3" /> Guardar
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{h.numero_cuarto}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {h.tipo && <span className="text-xs text-gray-500">{h.tipo}</span>}
                        {h.hotel && <span className="text-xs text-gray-400">· {h.hotel}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-medium ${lleno ? 'text-red-500' : 'text-gray-400'}`}>
                        <Users className="w-3 h-3 inline mr-0.5" />{ocupados}/{max}
                      </span>
                      <button onClick={() => startEdit(h)} className="p-1 text-gray-400 hover:text-brand-500 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCuarto(h)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {h.notas && !isEditing && (
                  <p className="text-xs text-gray-400 mb-2 italic">{h.notas}</p>
                )}

                {/* Viajeros asignados */}
                <div className="space-y-1.5 min-h-[50px]">
                  {h.asignaciones.map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 group">
                      <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-brand-700">{a.viajero.nombre.charAt(0)}</span>
                      </div>
                      <span className="text-xs text-gray-700 flex-1 truncate">{a.viajero.nombre}</span>
                      <button onClick={() => removerViajero(h.id, a.viajero_id, a.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-0.5 rounded">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {ocupados === 0 && !isEditing && (
                    <p className="text-xs text-gray-300 py-2 text-center">Sin viajeros asignados</p>
                  )}
                </div>

                {/* Assign button */}
                {!lleno && !isEditing && (
                  <div className="mt-3">
                    {assigningTo === h.id ? (
                      <div className="flex gap-1.5">
                        <select value={selectedViajero} onChange={e => setSelectedViajero(e.target.value)}
                          className="input text-xs flex-1">
                          <option value="">Seleccionar viajero...</option>
                          {filteredSin.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                        </select>
                        <button onClick={() => asignarViajero(h.id)} disabled={!selectedViajero || saving}
                          className="px-2 py-1 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700 disabled:opacity-50">
                          ✓
                        </button>
                        <button onClick={() => setAssigningTo(null)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setAssigningTo(h.id); setSelectedViajero('') }}
                        disabled={filteredSin.length === 0}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed w-full justify-center py-1 border border-dashed border-brand-300 rounded-lg hover:bg-brand-50 transition-colors">
                        <UserPlus className="w-3 h-3" />
                        Agregar viajero
                      </button>
                    )}
                  </div>
                )}

                {lleno && !isEditing && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600 justify-center">
                    <Check className="w-3 h-3" /> Cuarto completo
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sin cuarto sidebar */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-gray-900 text-sm">Sin cuarto asignado</h3>
              <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {filteredSin.length}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-1.5 max-h-[600px] overflow-y-auto">
            {filteredSin.map(v => (
              <div key={v.id} className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-orange-700">{v.nombre.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{v.nombre}</p>
                  {v.tipo_habitacion && <p className="text-xs text-gray-400">{v.tipo_habitacion}</p>}
                </div>
              </div>
            ))}
            {filteredSin.length === 0 && (
              <div className="py-10 text-center">
                <BedDouble className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">¡Todos asignados!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
