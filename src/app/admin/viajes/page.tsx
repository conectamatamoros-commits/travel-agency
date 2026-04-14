import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { Bus, Users, CreditCard, ChevronRight, Plus, Calendar } from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default async function ViajesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
  const { data: viajes } = await supabase.from('viajes').select('*').eq('activo', true).order('created_at', { ascending: false })

  // For each viaje get stats
  const viajeIds = viajes?.map(v => v.id) ?? []
  const { data: viajeroStats } = await supabase
    .from('viajeros')
    .select('viaje_id, total_pagado, saldo_pendiente, estado')
    .in('viaje_id', viajeIds)

  const statsMap = new Map<string, { total: number; activos: number; recaudado: number; pendiente: number }>()
  for (const v of viajeroStats ?? []) {
    if (!statsMap.has(v.viaje_id)) statsMap.set(v.viaje_id, { total: 0, activos: 0, recaudado: 0, pendiente: 0 })
    const s = statsMap.get(v.viaje_id)!
    s.total++
    if (v.estado === 'activo') s.activos++
    s.recaudado += v.total_pagado || 0
    s.pendiente += v.saldo_pendiente || 0
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Viajes</h1>
              <p className="text-gray-500 mt-1">{viajes?.length ?? 0} viajes registrados</p>
            </div>
            <Link href="/importar" className="btn-primary">
              <Plus className="w-4 h-4" />
              Importar Excel
            </Link>
          </div>

          {(!viajes || viajes.length === 0) ? (
            <div className="card p-16 text-center">
              <Bus className="w-14 h-14 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 text-lg mb-2">Sin viajes registrados</h3>
              <p className="text-gray-400 mb-6">Importa tus archivos Excel para comenzar</p>
              <Link href="/importar" className="btn-primary">Importar Excel</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {viajes.map(viaje => {
                const stats = statsMap.get(viaje.id) ?? { total: 0, activos: 0, recaudado: 0, pendiente: 0 }
                const pct = stats.recaudado + stats.pendiente > 0 
                  ? Math.round((stats.recaudado / (stats.recaudado + stats.pendiente)) * 100) : 0

                return (
                  <Link key={viaje.id} href={`/viajes/${viaje.id}`}
                    className="card p-5 hover:shadow-md transition-all group flex items-center gap-6">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Bus className="w-6 h-6 text-brand-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                            {viaje.nombre}
                          </h3>
                          {viaje.fecha_evento && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                {new Date(viaje.fecha_evento).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                          <div className="text-center">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold text-gray-900">{stats.activos}</span>
                            </div>
                            <p className="text-xs text-gray-400">viajeros</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-4 h-4 text-green-400" />
                              <span className="font-semibold text-green-600">{formatMXN(stats.recaudado)}</span>
                            </div>
                            <p className="text-xs text-gray-400">recaudado</p>
                          </div>
                          {stats.pendiente > 0 && (
                            <div className="text-center">
                              <span className="font-semibold text-orange-500">{formatMXN(stats.pendiente)}</span>
                              <p className="text-xs text-gray-400">pendiente</p>
                            </div>
                          )}
                          <div className="text-center min-w-[60px]">
                            <span className="font-semibold text-gray-900">{pct}%</span>
                            <div className="h-1 bg-gray-100 rounded-full mt-1 w-16">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-400 flex-shrink-0 transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
