'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, X, ChevronDown, ChevronUp, Phone } from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

interface Viajero {
  id: string
  nombre: string
  celular?: string
  correo?: string
  total_pagado: number
  total_costo: number
  saldo_pendiente: number
  tipo_habitacion?: string
  seccion_boleto?: string
  viaje_id: string
  viaje?: { nombre: string } | null
}

interface Abono {
  id: string
  viajero_id: string
  monto: number
  numero_abono?: number
  created_at: string
  notas?: string
}

interface Props {
  viajeros: Viajero[]
  viajes: { id: string; nombre: string }[]
  abonosPorViajero: Record<string, Abono[]>
  initialViaje?: string
}

export default function PagosClient({ viajeros, viajes, abonosPorViajero, initialViaje }: Props) {
  const supabase = createClient()
  const [q, setQ] = useState('')
  const [viajeFilter, setViajeFilter] = useState(initialViaje ?? '')
  const [soloDeuda, setSoloDeuda] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingAbono, setAddingAbono] = useState<string | null>(null)
  const [monto, setMonto] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [abonos, setAbonos] = useState<Record<string, Abono[]>>(abonosPorViajero)

  const filtered = useMemo(() => {
    let list = viajeros
    if (q) list = list.filter(v => v.nombre.toLowerCase().includes(q.toLowerCase()))
    if (viajeFilter) list = list.filter(v => v.viaje_id === viajeFilter)
    if (soloDeuda) list = list.filter(v => (v.saldo_pendiente || 0) > 0)
    return list
  }, [viajeros, q, viajeFilter, soloDeuda])

  async function addAbono(viajeroId: string, viajeId: string) {
    if (!monto || isNaN(Number(monto))) return
    setSaving(true)
    const montoNum = Number(monto)
    const existingAbonos = abonos[viajeroId] ?? []
    
    const { data, error } = await supabase.from('abonos').insert({
      viajero_id: viajeroId,
      viaje_id: viajeId,
      monto: montoNum,
      numero_abono: existingAbonos.length + 1,
      notas: notas || null,
    }).select().single()

    if (!error && data) {
      // Update local abonos
      setAbonos(prev => ({
        ...prev,
        [viajeroId]: [...(prev[viajeroId] ?? []), data]
      }))
      // Update viajero totals in DB
      await supabase.from('viajeros').update({
        total_pagado: (viajeros.find(v => v.id === viajeroId)?.total_pagado ?? 0) + montoNum,
        saldo_pendiente: Math.max(0, (viajeros.find(v => v.id === viajeroId)?.saldo_pendiente ?? 0) - montoNum),
      }).eq('id', viajeroId)
    }
    
    setMonto('')
    setNotas('')
    setAddingAbono(null)
    setSaving(false)
  }

  function openWA(celular: string, nombre: string, saldo: number) {
    const num = celular.replace(/\D/g,'')
    const mxNum = num.startsWith('52') ? num : `52${num}`
    const msg = encodeURIComponent(`Hola ${nombre.split(' ')[0]}, te recordamos que tienes un saldo pendiente de ${formatMXN(saldo)} para tu viaje. ¿Cuándo podrías realizarlo? 😊`)
    window.open(`https://wa.me/${mxNum}?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar viajero..." className="input pl-9" />
        </div>
        <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input w-52">
          <option value="">Todos los viajes</option>
          {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap cursor-pointer">
          <input type="checkbox" checked={soloDeuda} onChange={e => setSoloDeuda(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600" />
          Solo con deuda
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-header">Viajero</th>
              <th className="table-header">Viaje</th>
              <th className="table-header">Total costo</th>
              <th className="table-header">Pagado</th>
              <th className="table-header">Saldo</th>
              <th className="table-header">Estado</th>
              <th className="table-header">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(v => {
              const viajeroAbonos = abonos[v.id] ?? []
              const isExpanded = expandedId === v.id
              const isAddingThis = addingAbono === v.id
              const pagoPct = v.total_costo > 0 ? (v.total_pagado / v.total_costo) * 100 : 100

              return (
                <>
                  <tr key={v.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-brand-50/30' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-700">{v.nombre.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{v.nombre}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs text-gray-500 truncate max-w-[120px] block">
                        {(v.viaje as { nombre?: string } | null)?.nombre ?? '—'}
                      </span>
                    </td>
                    <td className="table-cell font-medium text-gray-700">{formatMXN(v.total_costo)}</td>
                    <td className="table-cell">
                      <div>
                        <span className="font-medium text-green-600">{formatMXN(v.total_pagado)}</span>
                        <div className="h-1 bg-gray-100 rounded-full mt-1 w-20">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(pagoPct, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {(v.saldo_pendiente || 0) > 0 
                        ? <span className="font-semibold text-orange-500">{formatMXN(v.saldo_pendiente)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                      {(v.saldo_pendiente || 0) <= 0 
                        ? <span className="badge-verde">Liquidado</span>
                        : <span className="badge-amarillo">Pendiente</span>}
                    </td>
                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {v.celular && (v.saldo_pendiente || 0) > 0 && (
                          <button onClick={() => openWA(v.celular!, v.nombre, v.saldo_pendiente)}
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Recordar pago por WhatsApp">
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { setAddingAbono(isAddingThis ? null : v.id); setExpandedId(v.id) }}
                          className="p-1.5 text-brand-500 hover:bg-brand-50 rounded-lg" title="Registrar abono">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {isExpanded && (
                    <tr key={`${v.id}-exp`}>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                        <div className="ml-9">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Historial de abonos ({viajeroAbonos.length})
                          </h4>
                          {viajeroAbonos.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {viajeroAbonos.map((a, i) => (
                                <div key={a.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                  <span className="text-xs text-gray-400">Abono {i + 1}</span>
                                  <p className="font-semibold text-green-600">{formatMXN(a.monto)}</p>
                                  {a.notas && <p className="text-xs text-gray-400">{a.notas}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 mb-4">Sin abonos registrados</p>
                          )}

                          {isAddingThis && (
                            <div className="flex items-end gap-3 p-4 bg-white border border-gray-200 rounded-xl max-w-md">
                              <div className="flex-1">
                                <label className="label">Monto del abono (MXN)</label>
                                <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                                  placeholder="0.00" className="input" autoFocus />
                              </div>
                              <div className="flex-1">
                                <label className="label">Notas (opcional)</label>
                                <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                                  placeholder="Transferencia, efectivo..." className="input" />
                              </div>
                              <button onClick={() => addAbono(v.id, v.viaje_id)} disabled={saving || !monto}
                                className="btn-primary">
                                {saving ? '...' : 'Guardar'}
                              </button>
                              <button onClick={() => setAddingAbono(null)} className="p-2 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center text-gray-400">No se encontraron viajeros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
