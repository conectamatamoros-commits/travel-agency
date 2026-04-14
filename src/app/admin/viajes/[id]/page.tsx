import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { 
  Bus, Users, CreditCard, BedDouble, 
  ChevronLeft, ArrowUpRight, Phone, Mail, 
  MessageSquare, CheckCircle, XCircle, Clock
} from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default async function ViajeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
  
  const { data: viaje } = await supabase.from('viajes').select('*').eq('id', params.id).single()
  if (!viaje) notFound()

  const { data: viajeros } = await supabase
    .from('viajeros')
    .select('*')
    .eq('viaje_id', params.id)
    .order('nombre')

  const activos = viajeros?.filter(v => v.estado === 'activo') ?? []
  const totalRecaudado = activos.reduce((s, v) => s + (v.total_pagado || 0), 0)
  const totalPendiente = activos.reduce((s, v) => s + (v.saldo_pendiente || 0), 0)
  const pagados = activos.filter(v => (v.saldo_pendiente || 0) <= 0)
  const conSaldo = activos.filter(v => (v.saldo_pendiente || 0) > 0)

  // Group by tipo_habitacion
  const porHab = activos.reduce((acc: Record<string, number>, v) => {
    const tipo = v.tipo_habitacion ?? 'Sin asignar'
    acc[tipo] = (acc[tipo] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <Link href="/viajes" className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <nav className="text-sm text-gray-400">
              <Link href="/viajes" className="hover:text-gray-600">Viajes</Link>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{viaje.nombre}</span>
            </nav>
          </div>

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center">
                <Bus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{viaje.nombre}</h1>
                {viaje.fecha_evento && (
                  <p className="text-gray-400 mt-0.5">
                    {new Date(viaje.fecha_evento).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/mensajes?viaje=${params.id}`} className="btn-secondary">
                <MessageSquare className="w-4 h-4" />
                Mensajes
              </Link>
              <Link href={`/viajeros?viaje=${params.id}`} className="btn-primary">
                <Users className="w-4 h-4" />
                Ver viajeros
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total viajeros', value: activos.length, icon: Users, color: 'brand' },
              { label: 'Total recaudado', value: formatMXN(totalRecaudado), icon: CreditCard, color: 'green' },
              { label: 'Saldo pendiente', value: formatMXN(totalPendiente), icon: Clock, color: 'orange' },
              { label: 'Pagos completos', value: `${pagados.length}/${activos.length}`, icon: CheckCircle, color: 'blue' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className={`inline-flex p-2 rounded-lg bg-${color}-50 mb-3`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Viajeros con saldo */}
            <div className="col-span-2 card">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Viajeros con saldo pendiente</h2>
                <Link href={`/pagos?viaje=${params.id}`} className="text-sm text-brand-600">
                  Ver pagos completos <ArrowUpRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {conSaldo.slice(0, 10).map(v => (
                  <div key={v.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600">{v.nombre.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/viajeros/${v.id}`} className="text-sm font-medium text-gray-900 hover:text-brand-600 truncate block">
                        {v.nombre}
                      </Link>
                      <p className="text-xs text-gray-400">{v.tipo_habitacion} · {v.seccion_boleto}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-green-600">{formatMXN(v.total_pagado)}</p>
                      <p className="text-xs text-orange-500">-{formatMXN(v.saldo_pendiente)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {v.celular && (
                        <a href={`https://wa.me/${v.celular.replace(/\D/g,'')}`} target="_blank"
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {v.correo && (
                        <a href={`mailto:${v.correo}`}
                          className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {conSaldo.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">¡Todos los viajeros están al corriente!</p>
                  </div>
                )}
                {conSaldo.length > 10 && (
                  <div className="px-5 py-3 text-center">
                    <Link href={`/pagos?viaje=${params.id}`} className="text-sm text-brand-600">
                      Ver {conSaldo.length - 10} más →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              {/* Por tipo de habitacion */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Tipos de habitación</h3>
                <div className="space-y-2">
                  {Object.entries(porHab).map(([tipo, count]) => (
                    <div key={tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 capitalize">{tipo.toLowerCase()}</span>
                      </div>
                      <span className="badge-azul">{count}</span>
                    </div>
                  ))}
                  {Object.keys(porHab).length === 0 && (
                    <p className="text-sm text-gray-400">Sin datos</p>
                  )}
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Cobertura de pagos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pagos completos</span>
                    <span className="font-medium text-green-600">{pagados.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Con saldo pendiente</span>
                    <span className="font-medium text-orange-500">{conSaldo.length}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Porcentaje cobrado</span>
                      <span>{totalRecaudado + totalPendiente > 0 ? Math.round(totalRecaudado / (totalRecaudado + totalPendiente) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full"
                        style={{ width: `${totalRecaudado + totalPendiente > 0 ? (totalRecaudado / (totalRecaudado + totalPendiente)) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Acciones</h3>
                <div className="space-y-2">
                  <Link href={`/cuartos?viaje=${params.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 p-2 rounded-lg hover:bg-gray-50">
                    <BedDouble className="w-4 h-4" /> Gestionar cuartos
                  </Link>
                  <Link href={`/mensajes?viaje=${params.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 p-2 rounded-lg hover:bg-gray-50">
                    <MessageSquare className="w-4 h-4" /> Enviar mensajes
                  </Link>
                  <Link href={`/tareas?viaje=${params.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 p-2 rounded-lg hover:bg-gray-50">
                    <CheckCircle className="w-4 h-4" /> Ver tareas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
