'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Phone, Mail, ChevronRight, Filter, X } from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

interface Viajero {
  id: string
  nombre: string
  celular?: string
  correo?: string
  talla?: string
  tipo_habitacion?: string
  seccion_boleto?: string
  total_pagado: number
  saldo_pendiente: number
  total_costo: number
  viaje?: { nombre: string } | null
  viaje_id: string
}

interface Props {
  viajeros: Viajero[]
  viajes: { id: string; nombre: string }[]
  initialViaje?: string
  initialPendiente?: boolean
  initialQ?: string
}

const TALLAS = ['XS','S','M','L','XL','2XL']
const HABITACIONES = ['Doble','Triple','Cuadruple','Individual']

export default function ViajerosClient({ viajeros, viajes, initialViaje, initialPendiente, initialQ }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState(initialQ ?? '')
  const [viajeFilter, setViajeFilter] = useState(initialViaje ?? '')
  const [pendiente, setPendiente] = useState(initialPendiente ?? false)
  const [habFilter, setHabFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let list = viajeros
    if (q) list = list.filter(v => v.nombre.toLowerCase().includes(q.toLowerCase()) || v.celular?.includes(q) || v.correo?.toLowerCase().includes(q.toLowerCase()))
    if (viajeFilter) list = list.filter(v => v.viaje_id === viajeFilter)
    if (pendiente) list = list.filter(v => (v.saldo_pendiente || 0) > 0)
    if (habFilter) list = list.filter(v => v.tipo_habitacion?.toLowerCase() === habFilter.toLowerCase())
    return list
  }, [viajeros, q, viajeFilter, pendiente, habFilter])

  function openWA(celular: string) {
    const num = celular.replace(/\D/g,'')
    const mxNum = num.startsWith('52') ? num : `52${num}`
    window.open(`https://wa.me/${mxNum}`, '_blank')
  }

  const activeFilters = [viajeFilter, pendiente, habFilter].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Search & Filters bar */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por nombre, teléfono o correo..."
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`btn-secondary relative ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div>
              <label className="label">Viaje</label>
              <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input">
                <option value="">Todos los viajes</option>
                {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo habitación</label>
              <select value={habFilter} onChange={e => setHabFilter(e.target.value)} className="input">
                <option value="">Todos</option>
                {HABITACIONES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado de pago</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={pendiente} onChange={e => setPendiente(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700">Solo con saldo pendiente</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">{filtered.length} viajeros encontrados</p>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Nombre</th>
                <th className="table-header">Viaje</th>
                <th className="table-header">Habitación</th>
                <th className="table-header">Talla</th>
                <th className="table-header">Pagado</th>
                <th className="table-header">Pendiente</th>
                <th className="table-header">Contacto</th>
                <th className="table-header w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-brand-700">{v.nombre.charAt(0)}</span>
                      </div>
                      <Link href={`/viajeros/${v.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                        {v.nombre}
                      </Link>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs text-gray-500 truncate max-w-[140px] block">
                      {(v.viaje as { nombre?: string } | null)?.nombre ?? '—'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {v.tipo_habitacion ? (
                      <span className="badge-azul">{v.tipo_habitacion}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="table-cell">
                    {v.talla ? <span className="badge-gris">{v.talla}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="table-cell">
                    <span className="font-medium text-green-600">{formatMXN(v.total_pagado)}</span>
                  </td>
                  <td className="table-cell">
                    {(v.saldo_pendiente || 0) > 0 ? (
                      <span className="font-medium text-orange-500">{formatMXN(v.saldo_pendiente)}</span>
                    ) : (
                      <span className="badge-verde">✓ Pagado</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {v.celular && (
                        <button onClick={() => openWA(v.celular!)}
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title={`WhatsApp: ${v.celular}`}>
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {v.correo && (
                        <a href={`mailto:${v.correo}`}
                          className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                          title={v.correo}>
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <Link href={`/viajeros/${v.id}`}>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    No se encontraron viajeros con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
