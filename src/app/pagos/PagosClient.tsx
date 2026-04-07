'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, X, ChevronDown, ChevronUp, Phone, Trash2, Edit2, Save, Check, Receipt } from 'lucide-react'
import ComprobantePago from './ComprobantePago'

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
  const [comprobante, setComprobante] = useState<{
    viajero: Viajero; viaje: { nombre: string }
    abono: { monto: number; numero_abono: number; notas?: string }
  } | null>(null)

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

  async function addAbono(viajero: Viajero) {
    if (!monto || isNaN(Number(monto))) return
    setSaving(true)
    const montoNum = Number(monto)
    const existingAbonos = abonos[viajero.id] ?? []
    const numeroAbono = existingAbonos.length + 1

    const { data, error } = await supabase.from('abonos').insert({
      viajero_id: viajero.id, viaje_id: viajero.viaje_id, monto: montoNum,
      numero_abono: numeroAbono, notas: notas || null,
    }).select().single()

    if (!error && data) {
      const nuevos = [...existingAbonos, data]
      setAbonos(prev => ({ ...prev, [viajero.id]: nuevos }))
      const total_pagado = nuevos.reduce((s, a) => s + a.monto, 0)
      const saldo_pendiente = Math.max(0, viajero.total_costo - total_pagado)
      await supabase.from('viajeros').update({ total_pagado, saldo_pendiente }).eq('id', viajero.id)
      recalcTotales(viajero.id, nuevos)
      const viajeroActualizado = { ...viajero, total_pagado, saldo_pendiente }
      setComprobante({
        viajero: viajeroActualizado,
        viaje: { nombre: (viajero.viaje as { nombre?: string } | null)?.nombre ?? '' },
        abono: { monto: montoNum, numero_abono: numeroAbono, notas: notas || undefined }
      })
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
        total_pagado, saldo_pendiente: Math.max(0, (viajero?.total_costo ?? 0) - total_pagado),
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
        total_pagado, saldo_pendiente: Math.max(0, (viajero?.total_costo ?? 0) - total_pagado),
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
    <>
      {comprobante && (
        <ComprobantePago
          viajero={comprobante.viajero}
          viaje={comprobante.viaje}
          abono={comprobante.abono}
          onClose={() => setComprobante(null)}
        />
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total recaudado</p>
            <p className="text-lg md:text-xl font-bold text-green-600 mt-1">{formatMXN(totalRecaudado)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total pendiente</p>
            <p className="text-lg md:text-xl font-bold text-orange-500 mt-1">{formatMXN(totalPendiente)}</p>
          </div>
          <div className="card p-4 hidden md:block">
            <p className="text-sm text-gray-500">Viajeros</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{filtered.length}</p>
          </div>
        </div>

        <div className="card p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar viajero..." className="input pl-9" />
          </div>
          <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input w-full md:w-52">
            <option value="">Todos los viajes</option>
            {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={soloDeuda} onChange={e => setSoloDeuda(e.target.checked)} className="w-4 h-4 rounded" />
            Solo con deuda
          </label>
          {msg && <span className="text-green-600 text-sm font-medium">{msg}</span>}
        </div>

        {/* Lista mobile-friendly */}
        <div className="space-y-2">
          {filtered.map(v => {
            const viajeroAbonos = abonos[v.id] ?? []
            const isExpanded = expandedId === v.id
            const isAddingThis = addingAbono === v.id
            const pagoPct = v.total_costo > 0 ? Math.min((v.total_pagado / v.total_costo) * 100, 100) : 100

            return (
              <div key={v.id} className="card overflow-hidden">
                {/* Fila principal */}
                <div className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-700">{v.nombre.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{v.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {(v.viaje as { nombre?: string } | null)?.nombre ?? ''}
                    </p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 w-full">
                      <div className={`h-full rounded-full ${pagoPct >= 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                        style={{ width: `${pagoPct}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-green-600">{formatMXN(v.total_pagado)}</p>
                    {(v.saldo_pendiente || 0) > 0
                      ? <p className="text-xs text-orange-500">-{formatMXN(v.saldo_pendiente)}</p>
                      : <p className="text-xs text-green-500">✓ Pagado</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {v.celular && (v.saldo_pendiente || 0) > 0 && (
                      <button onClick={e => { e.stopPropagation(); openWA(v.celular!, v.nombre, v.saldo_pendiente) }}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                        <Phone className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setAddingAbono(isAddingThis ? null : v.id); setExpandedId(v.id) }}
                      className="p-1.5 text-brand-500 hover:bg-brand-50 rounded-lg">
                      <Plus className="w-4 h-4" />
                    </button>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-300" />}
                  </div>
                </div>

                {/* Panel expandido */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Abonos ({viajeroAbonos.length})
                      </h4>
                      {viajeroAbonos.length > 0 && (
                        <button onClick={() => {
                          const ultimo = viajeroAbonos[viajeroAbonos.length - 1]
                          setComprobante({
                            viajero: v,
                            viaje: { nombre: (v.viaje as { nombre?: string } | null)?.nombre ?? '' },
                            abono: { monto: ultimo.monto, numero_abono: viajeroAbonos.length, notas: ultimo.notas }
                          })
                        }} className="flex items-center gap-1 text-xs text-brand-600">
                          <Receipt className="w-3.5 h-3.5" /> Comprobante
                        </button>
                      )}
                    </div>

                    {/* Abonos — botones SIEMPRE visibles */}
                    <div className="space-y-2 mb-4">
                      {viajeroAbonos.map((a, i) => (
                        <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-3">
                          {editingAbono === a.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-16">Abono {i + 1}</span>
                              <input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)}
                                className="input text-sm flex-1" autoFocus />
                              <button onClick={() => saveEditAbono(v.id, a.id)} disabled={saving}
                                className="p-2 bg-green-500 text-white rounded-lg">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingAbono(null)}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <p className="text-xs text-gray-400">Abono {i + 1}</p>
                                <p className="font-semibold text-green-600">{formatMXN(a.monto)}</p>
                                {a.notas && <p className="text-xs text-gray-400 mt-0.5">{a.notas}</p>}
                              </div>
                              {/* Botones SIEMPRE visibles */}
                              <button onClick={() => { setEditingAbono(a.id); setEditMonto(String(a.monto)) }}
                                className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg border border-brand-200">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteAbono(v.id, a.id)}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg border border-red-200">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {viajeroAbonos.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-2">Sin abonos registrados</p>
                      )}
                    </div>

                    {/* Agregar abono */}
                    {isAddingThis && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700">Nuevo abono</p>
                        <div>
                          <label className="label">Monto (MXN)</label>
                          <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                            placeholder="0.00" className="input" autoFocus />
                        </div>
                        <div>
                          <label className="label">Notas (opcional)</label>
                          <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                            placeholder="Transferencia, efectivo..." className="input" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addAbono(v)} disabled={saving || !monto} className="btn-primary flex-1">
                            {saving ? '...' : 'Guardar abono'}
                          </button>
                          <button onClick={() => setAddingAbono(null)} className="btn-secondary">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {!isAddingThis && (
                      <button onClick={() => setAddingAbono(v.id)}
                        className="w-full py-2 border-2 border-dashed border-brand-200 text-brand-600 text-sm rounded-xl hover:bg-brand-50 flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Registrar abono
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="card py-16 text-center text-gray-400">No se encontraron viajeros</div>
          )}
        </div>
      </div>
    </>
  )
}
