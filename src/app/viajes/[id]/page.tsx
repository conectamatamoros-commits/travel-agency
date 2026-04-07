import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Bus, Users, CreditCard, BedDouble, ChevronLeft, Phone, Mail, MessageSquare, CheckCircle, Clock } from 'lucide-react'
import EliminarViajeButton from './EliminarViajeButton'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default async function ViajeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viaje } = await supabase.from('viajes').select('*').eq('id', params.id).single()
  if (!viaje) notFound()

  const { data: viajeros } = await supabase.from('viajeros').select('*').eq('viaje_id', params.id).order('nombre')

  const activos = viajeros?.filter(v => v.estado === 'activo') ?? []
  const totalRecaudado = activos.reduce((s, v) => s + (v.total_pagado || 0), 0)
  const totalPendiente = activos.reduce((s, v) => s + (v.saldo_pendiente || 0), 0)
  const pagados = activos.filter(v => (v.saldo_pendiente || 0) <= 0)
  const conSaldo = activos.filter(v => (v.saldo_pendiente || 0) > 0)

  const porHab = activos.reduce((acc: Record<string, number>, v) => {
    const tipo = v.tipo_habitacion ?? 'Sin asignar'
    acc[tipo] = (acc[tipo] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <Link href="/viajes" className="hover:text-gray-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Viajes
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{viaje.nombre}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">{viaje.nombre}</h1>
            {viaje.fecha_evento && (
              <p className="text-gray-400 text-sm">
                {new Date(viaje.fecha_evento).toLocaleDateString('es-MX', { dateStyle: 'long' })}
              </p>
            )}
          </div>
        </div>
        <EliminarViajeButton viajeId={viaje.id} viajeNombre={viaje.nombre} />
      </div>

      {/* Acciones */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href={`/mensajes?viaje=${params.id}`} className="btn-secondary text-sm">
          <MessageSquare className="w-4 h-4" /> Mensajes
        </Link>
        <Link href={`/viajeros?viaje=${params.id}`} className="btn-primary text-sm">
          <Users className="w-4 h-4" /> Ver viajeros
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Viajeros', value: activos.length, icon: Users, color: 'text-brand-600' },
          { label: 'Recaudado', value: formatMXN(totalRecaudado), icon: CreditCard, color: 'text-green-600' },
          { label: 'Pendiente', value: formatMXN(totalPendiente), icon: Clock, color: 'text-orange-500' },
          { label: 'Pagados', value: `${pagados.length}/${activos.length}`, icon: CheckCircle, color: 'text-blue-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Viajeros con saldo */}
        <div className="md:col-span-2 card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Con saldo pendiente</h2>
            <Link href={`/pagos?viaje=${params.id}`} className="text-xs text-brand-600">Ver pagos →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {conSaldo.slice(0, 10).map(v => (
              <div key={v.id} className="px-4 py-3 flex items-center gap-3">
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
                <div className="flex gap-1">
                  {v.celular && (
                    <a href={`https://wa.me/52${v.celular.replace(/\D/g,'')}`} target="_blank"
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {conSaldo.length === 0 && (
              <div className="px-4 py-10 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">¡Todos al corriente!</p>
              </div>
            )}
          </div>
        </div>

        {/* Info lateral */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Habitaciones</h3>
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
              {Object.keys(porHab).length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Acciones</h3>
            <div className="space-y-2">
              <Link href={`/cuartos?viaje=${params.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 p-2 rounded-lg hover:bg-gray-50">
                <BedDouble className="w-4 h-4" /> Gestionar cuartos
              </Link>
              <Link href={`/mensajes?viaje=${params.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 p-2 rounded-lg hover:bg-gray-50">
                <MessageSquare className="w-4 h-4" /> Enviar mensajes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
