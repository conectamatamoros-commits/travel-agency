import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { 
  Bus, Users, CreditCard, TrendingUp, 
  AlertCircle, CheckCircle, Clock, BedDouble
} from 'lucide-react'
import Link from 'next/link'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()

  // Stats queries in parallel
  const [
    { count: totalViajes },
    { count: totalViajeros },
    { data: pagosData },
    { data: viajesRecientes },
    { data: tareasData },
    { data: viajerosPorViaje },
  ] = await Promise.all([
    supabase.from('viajes').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('viajeros').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('viajeros').select('total_pagado, total_costo, saldo_pendiente').eq('estado', 'activo'),
    supabase.from('viajes').select('id, nombre, created_at').eq('activo', true).order('created_at', { ascending: false }).limit(5),
    supabase.from('tareas').select('estado').neq('estado', 'completada'),
    supabase.from('viajeros').select('viaje_id, total_pagado, saldo_pendiente, viaje:viajes(nombre)').eq('estado', 'activo'),
  ])

  const totalRecaudado = pagosData?.reduce((s, v) => s + (v.total_pagado || 0), 0) ?? 0
  const totalPendiente = pagosData?.reduce((s, v) => s + (v.saldo_pendiente || 0), 0) ?? 0
  const tareasPendientes = tareasData?.length ?? 0

  // Group by viaje
  const resumenPorViaje = Object.entries(
    (viajerosPorViaje ?? []).reduce((acc: Record<string, { nombre: string; viajeros: number; recaudado: number; pendiente: number }>, v) => {
      const id = v.viaje_id
      const nombre = (v.viaje as { nombre?: string } | null)?.nombre ?? 'Sin nombre'
      if (!acc[id]) acc[id] = { nombre, viajeros: 0, recaudado: 0, pendiente: 0 }
      acc[id].viajeros++
      acc[id].recaudado += v.total_pagado || 0
      acc[id].pendiente += v.saldo_pendiente || 0
      return acc
    }, {})
  ).map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.viajeros - a.viajeros)

  const stats = [
    { label: 'Viajes activos', value: totalViajes ?? 0, icon: Bus, color: 'bg-brand-50 text-brand-700', iconColor: 'text-brand-600', href: '/viajes' },
    { label: 'Viajeros confirmados', value: totalViajeros ?? 0, icon: Users, color: 'bg-green-50 text-green-700', iconColor: 'text-green-600', href: '/viajeros' },
    { label: 'Total recaudado', value: formatMXN(totalRecaudado), icon: CreditCard, color: 'bg-blue-50 text-blue-700', iconColor: 'text-blue-600', href: '/pagos' },
    { label: 'Saldo pendiente', value: formatMXN(totalPendiente), icon: TrendingUp, color: 'bg-orange-50 text-orange-700', iconColor: 'text-orange-600', href: '/pagos' },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Buen día, {profile?.nombre?.split(' ')[0] ?? 'equipo'} 👋
            </h1>
            <p className="text-gray-500 mt-1">Resumen general de tu agencia</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color, iconColor, href }) => (
              <Link key={label} href={href} className="card p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Resumen por viaje */}
            <div className="col-span-2 card">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Viajeros por viaje</h2>
                <Link href="/viajes" className="text-sm text-brand-600 hover:text-brand-700">Ver todos →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {resumenPorViaje.slice(0, 8).map(({ id, nombre, viajeros, recaudado, pendiente }) => {
                  const pct = recaudado + pendiente > 0 ? (recaudado / (recaudado + pendiente)) * 100 : 0
                  return (
                    <div key={id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link href={`/viajes/${id}`} className="font-medium text-sm text-gray-900 hover:text-brand-600 truncate max-w-[200px]">
                          {nombre}
                        </Link>
                        <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-2">
                          <span className="text-gray-500">{viajeros} viajeros</span>
                          <span className="text-green-600 font-medium">{formatMXN(recaudado)}</span>
                          {pendiente > 0 && <span className="text-orange-500 font-medium">-{formatMXN(pendiente)}</span>}
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 rounded-full transition-all" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  )
                })}
                {resumenPorViaje.length === 0 && (
                  <div className="px-5 py-12 text-center text-gray-400">
                    <Bus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No hay viajes registrados aún</p>
                    <Link href="/importar" className="btn-primary mt-4 inline-flex">Importar Excel</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-4">
              {/* Tareas pendientes */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Tareas</h3>
                  <Link href="/tareas" className="text-xs text-brand-600">Ver todas →</Link>
                </div>
                {tareasPendientes > 0 ? (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-orange-800 text-sm">{tareasPendientes} tarea{tareasPendientes !== 1 ? 's' : ''} pendiente{tareasPendientes !== 1 ? 's' : ''}</p>
                      <Link href="/tareas" className="text-xs text-orange-600 hover:underline">Revisar ahora</Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-green-700 text-sm font-medium">¡Todo al día!</p>
                  </div>
                )}
              </div>

              {/* Accesos rápidos */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Accesos rápidos</h3>
                <div className="space-y-2">
                  {[
                    { href: '/importar', icon: Bus, label: 'Importar nuevo viaje', color: 'text-brand-600' },
                    { href: '/viajeros?pendiente=true', icon: Clock, label: 'Saldos pendientes', color: 'text-orange-500' },
                    { href: '/cuartos', icon: BedDouble, label: 'Asignación cuartos', color: 'text-blue-500' },
                    { href: '/mensajes', icon: CreditCard, label: 'Enviar mensajes', color: 'text-green-500' },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Viajes recientes */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Viajes recientes</h3>
                <div className="space-y-2">
                  {viajesRecientes?.map(v => (
                    <Link key={v.id} href={`/viajes/${v.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group">
                      <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 group-hover:text-brand-600 truncate">{v.nombre}</span>
                    </Link>
                  ))}
                  {(!viajesRecientes || viajesRecientes.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-2">Sin viajes aún</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
