'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BedDouble, Users, Plus, X, UserPlus, AlertCircle, Check } from 'lucide-react'

const TIPO_COLORS: Record<string, string> = {
  'DOBLE': 'bg-blue-50 border-blue-200',
  'Doble': 'bg-blue-50 border-blue-200',
  'TRIPLE': 'bg-purple-50 border-purple-200',
  'Triple': 'bg-purple-50 border-purple-200',
  'CUADRUPLE': 'bg-green-50 border-green-200',
  'Cuadruple': 'bg-green-50 border-green-200',
  'CUÁDRUPLE': 'bg-green-50 border-green-200',
  'INDIVIDUAL': 'bg-orange-50 border-orange-200',
  'Individual': 'bg-orange-50 border-orange-200',
}

const TIPO_MAX: Record<string, number> = {
  'DOBLE': 2, 'Doble': 2, 'TRIPLE': 3, 'Triple': 3,
  'CUADRUPLE': 4, 'Cuadruple': 4, 'CUÁDRUPLE': 4, 'INDIVIDUAL': 1, 'Individual': 1,
}

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
  const [assigningTo, setAssigningTo] = useState<string | null>(null) // habitacion id
  const [selectedViajero, setSelectedViajero] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const filteredHabs = useMemo(() =>
    viajeFilter ? habs.filter(h => h.viaje_id === viajeFilter) : habs,
    [habs, viajeFilter]
  )

  const filteredSin = useMemo(() =>
    viajeFilter ? sinCuarto.filter(v => v.viaje_id === viajeFilter) : sinCuarto,
    [sinCuarto, viajeFilter]
  )

  async function asignarViajero(habitacionId: string) {
    if (!selectedViajero) return
    setSaving(true)
    const { error } = await supabase.from('asignaciones_cuarto').insert({
      habitacion_id: habitacionId,
      viajero_id: selectedViajero,
    })
    if (!error) {
      const viajero = sinCuarto.find(v => v.id === selectedViajero)
      if (viajero) {
        setHabs(prev => prev.map(h => h.id === habitacionId ? {
          ...h,
          asignaciones: [...h.asignaciones, { id: Date.now().toString(), viajero_id: selectedViajero, viajero: { id: viajero.id, nombre: viajero.nombre } }]
        } : h))
        setSinCuarto(prev => prev.filter(v => v.id !== selectedViajero))
      }
      setMsg('Asignado correctamente')
      setTimeout(() => setMsg(''), 2000)
    }
    setSelectedViajero('')
    setAssigningTo(null)
    setSaving(false)
  }

  async function removerViajero(habitacionId: string, viajeroId: string, asignacionId: string) {
    const { error } = await supabase.from('asignaciones_cuarto').delete().eq('id', asignacionId)
    if (!error) {
      const hab = habs.find(h => h.id === habitacionId)
      const viajeroEnHab = hab?.asignaciones.find(a => a.viajero_id === viajeroId)
      setHabs(prev => prev.map(h => h.id === habitacionId ? {
        ...h,
        asignaciones: h.asignaciones.filter(a => a.id !== asignacionId)
      } : h))
      // Add back to sinCuarto
      if (viajeroEnHab) {
        setSinCuarto(prev => [...prev, { id: viajeroId, nombre: viajeroEnHab.viajero.nombre, viaje_id: hab!.viaje_id }])
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="card p-4 flex items-center gap-4">
        <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input w-64">
          <option value="">Todos los viajes</option>
          {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
        {msg && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="w-4 h-4" /> {msg}
          </div>
        )}
        <div className="ml-auto text-sm text-gray-500">
          {filteredHabs.length} cuartos · {filteredSin.length} sin asignar
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Room grid */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {filteredHabs.length === 0 && (
            <div className="col-span-2 card p-16 text-center">
              <BedDouble className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay cuartos registrados para este viaje</p>
              <p className="text-sm text-gray-400 mt-1">Importa un Excel con la hoja HABITACIONES/ROOMLIST</p>
            </div>
          )}

          {filteredHabs.map(h => {
            const max = TIPO_MAX[h.tipo ?? ''] ?? 4
            const ocupados = h.asignaciones.length
            const lleno = ocupados >= max
            const colorClass = TIPO_COLORS[h.tipo ?? ''] ?? 'bg-gray-50 border-gray-200'

            return (
              <div key={h.id} className={`card border-2 ${colorClass} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{h.numero_cuarto}</h3>
                    {h.tipo && <span className="text-xs text-gray-500">{h.tipo}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className={`text-xs font-medium ${lleno ? 'text-red-500' : 'text-gray-500'}`}>
                      {ocupados}/{max}
                    </span>
                  </div>
                </div>

                {/* Viajeros asignados */}
                <div className="space-y-1.5 min-h-[60px]">
                  {h.asignaciones.map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 group">
                      <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-brand-700">{a.viajero.nombre.charAt(0)}</span>
                      </div>
                      <span className="text-xs text-gray-700 flex-1 truncate">{a.viajero.nombre}</span>
                      <button onClick={() => removerViajero(h.id, a.viajero_id, a.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {ocupados === 0 && (
                    <p className="text-xs text-gray-300 py-2 text-center">Sin viajeros</p>
                  )}
                </div>

                {/* Assign button */}
                {!lleno && (
                  <div className="mt-3">
                    {assigningTo === h.id ? (
                      <div className="flex gap-1.5">
                        <select value={selectedViajero} onChange={e => setSelectedViajero(e.target.value)}
                          className="input text-xs flex-1">
                          <option value="">Seleccionar...</option>
                          {filteredSin.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                        </select>
                        <button onClick={() => asignarViajero(h.id)} disabled={!selectedViajero || saving}
                          className="px-2 py-1 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700 disabled:opacity-50">
                          ✓
                        </button>
                        <button onClick={() => setAssigningTo(null)} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setAssigningTo(h.id); setSelectedViajero('') }}
                        disabled={filteredSin.length === 0}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed">
                        <UserPlus className="w-3 h-3" />
                        Agregar viajero
                      </button>
                    )}
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
              <span className="badge-amarillo ml-auto">{filteredSin.length}</span>
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
                <p className="text-xs text-gray-400">Todos asignados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
