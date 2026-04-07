import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bus, Users, CreditCard, ChevronRight, Calendar } from 'lucide-react'
import NuevoViajeButton from './NuevoViajeButton'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default async function ViajesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase.from('viajes').select('*').eq('activo', true).order('created_at', { ascending: false })

  const viajeIds = viajes?.map(v => v.id) ?? []
  const { data: viajeroStats } = await supabase
    .from('viajeros')
    .select('viaje_id, total_pagado, saldo_pendiente, estado')
    .in('viaje_id', viajeIds)

  const statsMap = new Map<string, { activos: number; recaudado: number; pendiente: number }>()
  for (const v of viajeroStats ?? []) {
    if (!statsMap.has(v.viaje_id)) statsMap.set(v.viaje_id, { activos: 0, recaudado: 0, pendiente: 0 })
    const s = statsMap.get(v.viaje_id)!
    if (v.estado === 'activo') s.activos++
    s.recaudado += v.total_pagado || 0
    s.pendiente += v.saldo_pendiente || 0
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Viajes</h1>
          <p className="text-gray-500 mt-1 text-sm">{viajes?.length ?? 0} viajes registrados</p>
        </div>
        <div className="flex gap-2">
          <NuevoViajeButton />
          <Link href="/importar" className="btn-secondary text-sm">
            + Excel
          </Link>
        </div>
      </div>

      {(!viajes || viajes.length === 0) ? (
        <div className="card p-12 text-center">
          <Bus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Sin viajes registrados</h3>
          <p className="text-gray-400 text-sm mb-6">Crea un viaje o importa un Excel</p>
          <div className="flex gap-3 justify-center">
            <NuevoViajeButton />
            <Link href="/importar" className="btn-secondary">Importar Excel</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {viajes.map(viaje => {
            const stats = statsMap.get(viaje.id) ?? { activos: 0, recaudado: 0, pendiente: 0 }
            const pct = stats.recaudado + stats.pendiente > 0
              ? Math.round((stats.recaudado / (stats.recaudado + stats.pendiente)) * 100) : 0

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
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {stats.activos}
                    </span>
                    <span className="text-xs text-green-600 font-medium">{formatMXN(stats.recaudado)}</span>
                    {stats.pendiente > 0 && (
                      <span className="text-xs text-orange-500">-{formatMXN(stats.pendiente)}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{pct}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mt-1.5">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
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
