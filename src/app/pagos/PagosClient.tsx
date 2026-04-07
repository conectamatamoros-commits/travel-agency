'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, X, ChevronDown, ChevronUp, Phone, Trash2, Edit2, Save, Check } from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

interface Abono {
  id: string; viajero_id: string; monto: number; numero_abono?: number
  created_at: string; notas?: string
}

interface Viajero {
  id: string; nombre: string; celular?: string; correo?: string
  total_pagado: number; total_costo: number; saldo_pendiente: number
  tipo_habitacion?: string; seccion_boleto?: string; viaje_id: string
  viaje?: { nombre: string } | null
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
  const [viajerosList, setViajerosList] = useState(viajeros)
  const [editingAbono, setEditingAbono] = useState<string | null>(null)
  const [editMonto, setEditMonto] = useState('')
  const [msg, setMsg] = useState('')

  const filtered = useMemo(() => {
    let list = viajerosList
    if (q) list = list.filter(v => v.nombre.toLowerCase().includes(q.toLowerCase()))
    if (viajeFilter) list = list.filter(v => v.viaje_id === viajeFilter)
    if (soloDeuda) list = list.filter(v => (v.saldo_pendiente || 0) > 0)
    return list
  }, [viajerosList, q, viajeFilter, soloDeuda])

  function showMsg(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  function recalcTotales(viajeroId: string, nuevosAbonos: Abono[]) {
    const total_pagado = nuevosAbonos.reduce((s, a) => s + a.monto, 0)
    setViajerosList(prev => prev.map(v => {
      if (v.id !== viajeroId) return v
      return { ...v, total_pagado, saldo_pendiente: Math.max(0, v.total_costo - total_pagado) }
    }))
  }

  async function addAbono(viajeroId: string, viajeId: string) {
    if (!monto || isNaN(Number(monto))) return
    setSaving(true)
    const montoNum = Number(monto)
    const existingAbonos = abonos[viajeroId] ?? []
    const { data, error } = await supabase.from('abonos').insert({
      viajero_id: viajeroId, viaje_id: viajeId, monto: montoNum,
      numero_abono: existingAbonos.length + 1, notas: notas || null,
    }).select().single()

    if (!error && data) {
      const nuevos = [...existingAbonos, data]
      setAbonos(prev => ({ ...prev, [viajeroId]: nuevos }))
      const total_pagado = nuevos.reduce((s, a) => s + a.monto, 0)
      const viajero = viajerosList.find(v => v.id === viajeroId)
      await supabase.from('viajeros').update({
        total_pagado,
        saldo_pendiente: Math.max(0, (viajero?.total_costo ?? 0) - total_pagado),
      }).eq('id', viajeroId)
      recalcTotales(viajeroId, nuevos)
      showMsg('✅ Abono registrado')
    }
    setMonto(''); setNotas(''); setAddingAbono(null)
    setSaving(false)
  }

  async function deleteAbono(viajeroId: string, abonoId: string) {
    if (!confirm('¿Eliminar este abono?')) return
    const { error } = await supabase.from('abonos').delete().eq('id', abonoId)
    if (!error) {
      const nuevos = (abonos[viajeroId] ?? []).filter(a => a.id !== abonoId)
      setAbonos(prev => ({ ...prev, [viajeroId]: nuevos }))
      const total_pagado = nuevos.reduce((s, a) => s + a.monto, 0)
      const viajero = viajerosList.find(v => v.id === viajeroId)
      await supabase.from('viajeros').update({
        total_pagado,
        saldo_pendiente: Math.max(0, (viajero?.total_costo ?? 0) - total_pagado),
      }).eq('id', viajeroId)
      recalcTotales(viajeroId, nuevos)
      showMsg('✅ Abono eliminado')
    }
  }

  async function saveEditAbono(viajeroId: string, abonoId: string) {
    if (!editMonto || isNaN(Number(editMonto))) return
    setSaving(true)
    const { error } = await supabase.from('abonos').update({ monto: Number(editMonto) }).eq('id', abonoId)
    if (!error) {
      const nuevos = (abonos[viajeroId] ?? []).map(a => a.id === abonoId ? { ...a, monto: Number(editMonto) } : a)
      setAbonos(prev => ({ ...prev, [viajeroId]: nuevos }))
      const total_pagado = nuevos.reduce((s, a) => s + a.monto, 0)
      const viajero = viajerosList.find(v => v.id === viajeroId)
      await supabase.from('viajeros').update({
        total_pagado,
        saldo_pendiente: Math.max(0, (viajero?.total_costo ?? 0) - total_pagado),
      }).eq('id', viajeroId)
      recalcTotales(viajeroId, nuevos)
      showMsg('✅ Abono editado')
    }
    setEditingAbono(null); setEditMonto('')
    setSaving(false)
  }

  function openWA(celular: string, nombre: string, saldo: number) {
    const num = celular.replace(/\D/g, '')
    const mxNum = num.startsWith('52') ? num : `52${num}`
    const msg = encodeURIComponent(`Hola ${nombre.split(' ')[0]}, te recordamos que tienes un saldo pendiente de ${formatMXN(saldo)}. ¿Cuándo podrías realizarlo? 😊`)
    window.open(`https://wa.me/${mxNum}?text=${msg}`, '_blank')
  }

  const totalRecaudado = filtered.reduce((s, v) => s + (v.total_pagado || 0), 0)
  const totalPendiente = filtered.reduce((s, v) => s + (v.saldo_pendiente || 0), 0)

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total recaudado (filtro)</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatMXN(totalRecaudado)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total pendiente (filtro)</p>
          <p className="text-xl font-bold text-orange-500 mt-1">{formatMXN(totalPendiente)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Viajeros mostrados</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar viajero..." className="input pl-9" />
        </div>
        <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input w-52">
          <option value="">Todos los viajes</option>
          {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap cursor-pointer">
          <input type="checkbox" checked={soloDeuda} onChange={e => setSoloDeuda(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
          Solo con deuda
        </label>
        {msg && <span className="text-green-600 text-sm font-medium ml-auto">{msg}</span>}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-header">Viajero</th>
              <th className="table-header">Viaje</th>
              <th className="table-header">Total costo</th>
              <th className="table-header">Pagado</th>
              <th className="table-header">Pendiente</th>
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
                  <tr key={v.id}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-brand-50/30' : ''}`}
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
                                <div key={a.id} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm group relative">
                                  <p className="text-xs text-gray-400">Abono {i + 1}</p>
                                  {editingAbono === a.id ? (
                                    <div className="flex items-center gap-1 mt-1">
                                      <input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)}
                                        className="input text-xs w-24 py-1" autoFocus />
                                      <button onClick={() => saveEditAbono(v.id, a.id)} disabled={saving}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded">
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => setEditingAbono(null)}
                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-green-600">{formatMXN(a.monto)}</p>
                                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                        <button onClick={() => { setEditingAbono(a.id); setEditMonto(String(a.monto)) }}
                                          className="p-0.5 text-gray-400 hover:text-brand-500">
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => deleteAbono(v.id, a.id)}
                                          className="p-0.5 text-gray-400 hover:text-red-500">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {a.notas && <p className="text-xs text-gray-400 mt-0.5">{a.notas}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 mb-4">Sin abonos registrados</p>
                          )}

                          {isAddingThis && (
                            <div className="flex items-end gap-3 p-4 bg-white border border-gray-200 rounded-xl max-w-md">
                              <div className="flex-1">
                                <label className="label">Monto (MXN)</label>
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
