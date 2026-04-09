'use client'

import { useState, useMemo } from 'react'
import { Calendar, TrendingUp, DollarSign, Users, Filter } from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

interface Abono {
  id: string
  monto: number
  created_at: string
  notas?: string
  viajero?: {
    nombre: string
    viaje_id: string
    viaje?: { nombre: string } | null
  } | null
}

interface Props {
  abonos: Abono[]
  viajes: { id: string; nombre: string }[]
}

type Periodo = 'dia' | 'semana' | 'mes'

export default function ReportesClient({ abonos, viajes }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [viajeFilter, setViajeFilter] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const abonosFiltrados = useMemo(() => {
    let list = abonos
    if (viajeFilter) list = list.filter(a => a.viajero?.viaje_id === viajeFilter)
    if (fechaInicio) list = list.filter(a => new Date(a.created_at) >= new Date(fechaInicio))
    if (fechaFin) list = list.filter(a => new Date(a.created_at) <= new Date(fechaFin + 'T23:59:59'))
    return list
  }, [abonos, viajeFilter, fechaInicio, fechaFin])

  // Agrupar por período
  const grupos = useMemo(() => {
    const map = new Map<string, { label: string; abonos: Abono[]; total: number }>()

    for (const a of abonosFiltrados) {
      const fecha = new Date(a.created_at)
      let key = ''
      let label = ''

      if (periodo === 'dia') {
        key = fecha.toISOString().slice(0, 10)
        label = fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      } else if (periodo === 'semana') {
        const startOfWeek = new Date(fecha)
        startOfWeek.setDate(fecha.getDate() - fecha.getDay())
        key = startOfWeek.toISOString().slice(0, 10)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        label = `${startOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${endOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
      } else {
        key = fecha.toISOString().slice(0, 7)
        label = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
          .replace(/^\w/, c => c.toUpperCase())
      }

      if (!map.has(key)) map.set(key, { label, abonos: [], total: 0 })
      const g = map.get(key)!
      g.abonos.push(a)
      g.total += a.monto
    }

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, v]) => v)
  }, [abonosFiltrados, periodo])

  const totalGeneral = abonosFiltrados.reduce((s, a) => s + a.monto, 0)
  const totalPagos = abonosFiltrados.length
  const promedioAbono = totalPagos > 0 ? totalGeneral / totalPagos : 0
  const viajeroUnicos = new Set(abonosFiltrados.map(a => a.viajero?.nombre)).size

  const [expandedGrupo, setExpandedGrupo] = useState<number | null>(0)

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Agrupar por</label>
            <select value={periodo} onChange={e => setPeriodo(e.target.value as Periodo)} className="input">
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>
          <div>
            <label className="label">Viaje</label>
            <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input">
              <option value="">Todos</option>
              {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Fecha fin</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total recaudado', value: formatMXN(totalGeneral), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Número de abonos', value: totalPagos, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Promedio por abono', value: formatMXN(promedioAbono), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Viajeros que pagaron', value: viajeroUnicos, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabla por período */}
      <div className="space-y-3">
        {grupos.length === 0 && (
          <div className="card p-12 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay pagos en este período</p>
          </div>
        )}

        {grupos.map((g, idx) => (
          <div key={idx} className="card overflow-hidden">
            {/* Header del grupo */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedGrupo(expandedGrupo === idx ? null : idx)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm capitalize">{g.label}</p>
                  <p className="text-xs text-gray-400">{g.abonos.length} pago{g.abonos.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{formatMXN(g.total)}</p>
                <p className="text-xs text-gray-400">{expandedGrupo === idx ? '▲ Ocultar' : '▼ Ver detalle'}</p>
              </div>
            </div>

            {/* Detalle */}
            {expandedGrupo === idx && (
              <div className="border-t border-gray-100">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Fecha</th>
                      <th className="table-header">Viajero</th>
                      <th className="table-header">Viaje</th>
                      <th className="table-header">Notas</th>
                      <th className="table-header text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {g.abonos.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                          {new Date(a.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="table-cell">
                          <p className="text-sm font-medium text-gray-900">{a.viajero?.nombre ?? '—'}</p>
                        </td>
                        <td className="table-cell">
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">
                            {a.viajero?.viaje?.nombre ?? '—'}
                          </p>
                        </td>
                        <td className="table-cell">
                          <p className="text-xs text-gray-400">{a.notas ?? '—'}</p>
                        </td>
                        <td className="table-cell text-right">
                          <span className="font-semibold text-green-600">{formatMXN(a.monto)}</span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="table-cell text-right text-sm text-gray-700">Total del período:</td>
                      <td className="table-cell text-right text-green-600">{formatMXN(g.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
