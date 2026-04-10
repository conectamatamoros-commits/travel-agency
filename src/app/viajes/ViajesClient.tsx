'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Bus, Users, CreditCard, ChevronRight, Calendar, ArrowUpDown, Search } from 'lucide-react'
import NuevoViajeButton from './NuevoViajeButton'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

interface ViajeStats {
  id: string
  nombre: string
  fecha_evento?: string
  created_at: string
  activos: number
  recaudado: number
  pendiente: number
}

interface Props {
  viajes: ViajeStats[]
}

type OrdenKey = 'fecha_evento' | 'nombre' | 'created_at' | 'activos' | 'pendiente'

const ORDEN_OPCIONES: { key: OrdenKey; label: string }[] = [
  { key: 'fecha_evento', label: 'Fecha del evento' },
  { key: 'nombre', label: 'Nombre (A-Z)' },
  { key: 'created_at', label: 'Más reciente' },
  { key: 'activos', label: 'Más viajeros' },
  { key: 'pendiente', label: 'Mayor deuda' },
]

export default function ViajesClient({ viajes }: Props) {
  const [orden, setOrden] = useState<OrdenKey>('created_at')
  const [q, setQ] = useState('')

  const filtrados = useMemo(() => {
    let list = viajes
    if (q) list = list.filter(v => v.nombre.toLowerCase().includes(q.toLowerCase()))

    return [...list].sort((a, b) => {
      switch (orden) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre)
        case 'fecha_evento':
          if (!a.fecha_evento && !b.fecha_evento) return 0
          if (!a.fecha_evento) return 1
          if (!b.fecha_evento) return -1
          return new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime()
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'activos':
          return b.activos - a.activos
        case 'pendiente':
          return b.pendiente - a.pendiente
        default:
          return 0
      }
    })
  }, [viajes, orden, q])

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar viaje..." className="input pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select value={orden} onChange={e => setOrden(e.target.value as OrdenKey)} className="input w-48">
            {ORDEN_OPCIONES.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
        <NuevoViajeButton />
        <Link href="/importar" className="btn-secondary text-sm">+ Excel</Link>
      </div>

      <p className="text-sm text-gray-500">{filtrados.length} viajes</p>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <Bus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Sin viajes registrados</h3>
          <div className="flex gap-3 justify-center mt-4">
            <NuevoViajeButton />
            <Link href="/importar" className="btn-secondary">Importar Excel</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(viaje => {
            const pct = viaje.recaudado + viaje.pendiente > 0
              ? Math.round((viaje.recaudado / (viaje.recaudado + viaje.pendiente)) * 100) : 0

            return (
              <Link key={viaje.id} href={`/viajes/${viaje.id}`}
                className="card p-4 hover:shadow-md transition-all group flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <Bus className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 text-sm truncate">
                    {viaje.nombre}
                  </h3>
                  {viaje.fecha_evento && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(viaje.fecha_evento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {viaje.activos} viajeros
                    </span>
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> {formatMXN(viaje.recaudado)}
                    </span>
                    {viaje.pendiente > 0 && (
                      <span className="text-xs text-orange-500">-{formatMXN(viaje.pendiente)}</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold text-gray-900">{pct}%</p>
                  <p className="text-xs text-gray-400">pagado</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
