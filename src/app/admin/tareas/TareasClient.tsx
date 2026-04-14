'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, CheckSquare, Clock, AlertCircle, Zap, Check, Bus } from 'lucide-react'

type Estado = 'pendiente' | 'en_progreso' | 'completada'
type Prioridad = 'baja' | 'normal' | 'alta' | 'urgente'

interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  estado: Estado
  prioridad: Prioridad
  viaje_id?: string
  asignado_a?: string
  fecha_vencimiento?: string
  created_at: string
  viaje?: { nombre: string } | null
  asignado?: { nombre: string } | null
}

interface Props {
  tareas: Tarea[]
  viajes: { id: string; nombre: string }[]
  usuarios: { id: string; nombre: string; rol: string }[]
  currentUserId: string
  initialViaje?: string
}

const ESTADOS: { key: Estado; label: string; color: string; icon: React.ElementType }[] = [
  { key: 'pendiente', label: 'Pendiente', color: 'border-gray-300', icon: Clock },
  { key: 'en_progreso', label: 'En progreso', color: 'border-brand-400', icon: AlertCircle },
  { key: 'completada', label: 'Completada', color: 'border-green-400', icon: Check },
]

const PRIORIDAD_COLORS: Record<Prioridad, string> = {
  baja: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

export default function TareasClient({ tareas: initialTareas, viajes, usuarios, currentUserId, initialViaje }: Props) {
  const supabase = createClient()
  const [tareas, setTareas] = useState(initialTareas)
  const [showing, setShowing] = useState(false)
  const [viajeFilter, setViajeFilter] = useState(initialViaje ?? '')
  const [soloMias, setSoloMias] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'normal' as Prioridad, viaje_id: '', asignado_a: '', fecha_vencimiento: '' })
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    let list = tareas
    if (viajeFilter) list = list.filter(t => t.viaje_id === viajeFilter)
    if (soloMias) list = list.filter(t => t.asignado_a === currentUserId)
    return list
  }, [tareas, viajeFilter, soloMias, currentUserId])

  async function createTarea() {
    if (!form.titulo.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('tareas').insert({
      ...form,
      estado: 'pendiente' as Estado,
      created_by: currentUserId,
      viaje_id: form.viaje_id || null,
      asignado_a: form.asignado_a || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
    }).select('*, viaje:viajes(nombre), asignado:user_profiles!tareas_asignado_a_fkey(nombre)').single()

    if (!error && data) {
      setTareas(prev => [data, ...prev])
      setForm({ titulo: '', descripcion: '', prioridad: 'normal', viaje_id: '', asignado_a: '', fecha_vencimiento: '' })
      setShowing(false)
    }
    setSaving(false)
  }

  async function updateEstado(id: string, estado: Estado) {
    await supabase.from('tareas').update({ estado }).eq('id', id)
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado } : t))
  }

  async function deleteTarea(id: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tareas').delete().eq('id', id)
    setTareas(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input w-52">
            <option value="">Todos los viajes</option>
            {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-600">
            <input type="checkbox" checked={soloMias} onChange={e => setSoloMias(e.target.checked)} className="w-4 h-4 rounded" />
            Solo mis tareas
          </label>
        </div>
        <button onClick={() => setShowing(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva tarea
        </button>
      </div>

      {/* New task form */}
      {showing && (
        <div className="card p-6 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Nueva tarea</h3>
            <button onClick={() => setShowing(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Título *</label>
              <input value={form.titulo} onChange={e => setForm(f => ({...f, titulo: e.target.value}))}
                placeholder="Ej: Confirmar hotel para Kenia Os" className="input" autoFocus />
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))}
                rows={2} className="input resize-none" placeholder="Detalles adicionales..." />
            </div>
            <div>
              <label className="label">Viaje (opcional)</label>
              <select value={form.viaje_id} onChange={e => setForm(f => ({...f, viaje_id: e.target.value}))} className="input">
                <option value="">General</option>
                {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Asignar a</label>
              <select value={form.asignado_a} onChange={e => setForm(f => ({...f, asignado_a: e.target.value}))} className="input">
                <option value="">Sin asignar</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm(f => ({...f, prioridad: e.target.value as Prioridad}))} className="input">
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="label">Fecha límite</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm(f => ({...f, fecha_vencimiento: e.target.value}))} className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowing(false)} className="btn-secondary">Cancelar</button>
            <button onClick={createTarea} disabled={saving || !form.titulo.trim()} className="btn-primary">
              {saving ? 'Guardando...' : 'Crear tarea'}
            </button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-6">
        {ESTADOS.map(({ key, label, color, icon: Icon }) => {
          const columnTareas = filtered.filter(t => t.estado === key)
          return (
            <div key={key} className="card overflow-hidden">
              <div className={`p-4 border-b-2 ${color} flex items-center gap-2`}>
                <Icon className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
                <span className="ml-auto badge-gris">{columnTareas.length}</span>
              </div>
              <div className="p-3 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto">
                {columnTareas.map(tarea => (
                  <div key={tarea.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-gray-900 leading-snug flex-1">{tarea.titulo}</h4>
                      <button onClick={() => deleteTarea(tarea.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {tarea.descripcion && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{tarea.descripcion}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDAD_COLORS[tarea.prioridad]}`}>
                        {tarea.prioridad}
                      </span>
                      {(tarea.viaje as { nombre?: string } | null)?.nombre && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Bus className="w-3 h-3" />
                          {(tarea.viaje as { nombre: string }).nombre.split(' ').slice(0,2).join(' ')}
                        </span>
                      )}
                      {(tarea.asignado as { nombre?: string } | null)?.nombre && (
                        <span className="text-xs text-gray-400">→ {(tarea.asignado as { nombre: string }).nombre.split(' ')[0]}</span>
                      )}
                    </div>

                    {tarea.fecha_vencimiento && (
                      <p className={`text-xs mt-2 ${new Date(tarea.fecha_vencimiento) < new Date() && tarea.estado !== 'completada' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        📅 {new Date(tarea.fecha_vencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </p>
                    )}

                    {/* Move buttons */}
                    {tarea.estado !== 'completada' && (
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-gray-50">
                        {tarea.estado === 'pendiente' && (
                          <button onClick={() => updateEstado(tarea.id, 'en_progreso')}
                            className="flex-1 text-xs py-1 text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                            Iniciar
                          </button>
                        )}
                        <button onClick={() => updateEstado(tarea.id, 'completada')}
                          className="flex-1 text-xs py-1 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                          Completar
                        </button>
                      </div>
                    )}
                    {tarea.estado === 'completada' && (
                      <button onClick={() => updateEstado(tarea.id, 'pendiente')}
                        className="text-xs mt-2 text-gray-400 hover:text-gray-600">
                        Reabrir
                      </button>
                    )}
                  </div>
                ))}
                {columnTareas.length === 0 && (
                  <div className="py-10 text-center text-gray-300">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">Sin tareas</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
