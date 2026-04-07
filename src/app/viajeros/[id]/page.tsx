import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { 
  ChevronLeft, Phone, Mail, BedDouble, CreditCard, 
  User, Calendar, Shirt, Tag, AlertCircle, MessageSquare,
  CheckCircle, PhoneCall
} from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default async function ViajeroDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()

  const { data: viajero } = await supabase
    .from('viajeros')
    .select('*, viaje:viajes(id,nombre)')
    .eq('id', params.id)
    .single()
  if (!viajero) notFound()

  const { data: abonos } = await supabase
    .from('abonos').select('*').eq('viajero_id', params.id).order('numero_abono')

  const { data: contacto } = await supabase
    .from('contactos_emergencia').select('*').eq('viajero_id', params.id).single()

  const { data: asignacion } = await supabase
    .from('asignaciones_cuarto')
    .select('*, habitacion:habitaciones(numero_cuarto, tipo)')
    .eq('viajero_id', params.id)
    .single()

  const pct = viajero.total_costo > 0
    ? Math.min(Math.round((viajero.total_pagado / viajero.total_costo) * 100), 100) : 100

  function getWALink(cel: string) {
    const num = cel.replace(/\D/g,'')
    const mxNum = num.startsWith('52') ? num : `52${num}`
    return `https://wa.me/${mxNum}`
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
            <Link href="/viajeros" className="hover:text-gray-600 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Viajeros
            </Link>
            <span>/</span>
            <span className="text-gray-700">{viajero.nombre}</span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left - Main info */}
            <div className="col-span-2 space-y-5">
              {/* Header card */}
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-brand-700">{viajero.nombre.charAt(0)}</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">{viajero.nombre}</h1>
                      {(viajero.viaje as { nombre?: string } | null)?.nombre && (
                        <Link href={`/viajes/${(viajero.viaje as { id: string }).id}`}
                          className="text-sm text-brand-600 hover:underline">
                          🚌 {(viajero.viaje as { nombre: string }).nombre}
                        </Link>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {viajero.tipo_habitacion && <span className="badge-azul">{viajero.tipo_habitacion}</span>}
                        {viajero.seccion_boleto && <span className="badge-gris">{viajero.seccion_boleto}</span>}
                        {viajero.talla && <span className="badge-gris">Talla: {viajero.talla}</span>}
                        {viajero.descuento && <span className="badge-amarillo">{viajero.descuento}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {viajero.celular && (
                      <a href={getWALink(viajero.celular)} target="_blank"
                        className="btn-secondary text-green-600 border-green-200 hover:bg-green-50 text-sm">
                        <Phone className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                    {viajero.correo && (
                      <a href={`mailto:${viajero.correo}`}
                        className="btn-secondary text-blue-600 border-blue-200 hover:bg-blue-50 text-sm">
                        <Mail className="w-4 h-4" /> Correo
                      </a>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
                  {[
                    { icon: Phone, label: 'Celular', value: viajero.celular },
                    { icon: Mail, label: 'Correo', value: viajero.correo },
                    { icon: Calendar, label: 'Inscripción', value: viajero.fecha_inscripcion 
                      ? new Date(viajero.fecha_inscripcion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) 
                      : null },
                    { icon: Shirt, label: 'Talla', value: viajero.talla },
                    { icon: Tag, label: 'Descuento', value: viajero.descuento },
                    { icon: User, label: 'Ciudadanía', value: viajero.ciudadania },
                  ].map(({ icon: Icon, label, value }) => value ? (
                    <div key={label}>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                        <Icon className="w-3 h-3" /> {label}
                      </p>
                      <p className="text-sm font-medium text-gray-800">{value}</p>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Pagos card */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" /> Pagos y Abonos
                  </h2>
                  <Link href={`/pagos`} className="text-sm text-brand-600">Gestionar →</Link>
                </div>

                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Progreso de pago</span>
                  <span className="font-semibold text-gray-900">{pct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 50 ? 'bg-brand-500' : 'bg-orange-400'}`}
                    style={{ width: `${pct}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Total costo', value: formatMXN(viajero.total_costo), color: 'text-gray-700' },
                    { label: 'Pagado', value: formatMXN(viajero.total_pagado), color: 'text-green-600' },
                    { label: 'Pendiente', value: formatMXN(viajero.saldo_pendiente), color: viajero.saldo_pendiente > 0 ? 'text-orange-500' : 'text-gray-300' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className={`text-lg font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {abonos && abonos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Historial ({abonos.length} abonos)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {abonos.map((a, i) => (
                        <div key={a.id} className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Abono {i + 1}</p>
                            <p className="text-sm font-semibold text-green-700">{formatMXN(a.monto)}</p>
                            {a.notas && <p className="text-xs text-gray-400">{a.notas}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viajero.saldo_pendiente <= 0 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mt-4">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium text-green-700">¡Pago completado! Viajero al corriente.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              {/* Cuarto asignado */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-gray-400" /> Habitación
                </h3>
                {asignacion ? (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="font-semibold text-blue-800">{(asignacion.habitacion as { numero_cuarto: string } | null)?.numero_cuarto}</p>
                    <p className="text-sm text-blue-600">{(asignacion.habitacion as { tipo?: string } | null)?.tipo ?? 'Sin tipo'}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="text-sm text-orange-700">Sin cuarto asignado</p>
                  </div>
                )}
                <Link href="/cuartos" className="btn-secondary w-full justify-center mt-3 text-sm py-2">
                  Gestionar cuartos
                </Link>
              </div>

              {/* Contacto emergencia */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-gray-400" /> Contacto de emergencia
                </h3>
                {contacto ? (
                  <div className="space-y-3">
                    {contacto.nombre && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Nombre</p>
                          <p className="text-sm font-medium text-gray-800">{contacto.nombre}</p>
                        </div>
                      </div>
                    )}
                    {contacto.parentesco && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Parentesco</p>
                          <p className="text-sm font-medium text-gray-800">{contacto.parentesco}</p>
                        </div>
                      </div>
                    )}
                    {contacto.numero && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Número</p>
                          <a href={getWALink(contacto.numero)} target="_blank"
                            className="text-sm font-medium text-green-600 hover:underline">
                            {contacto.numero}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Sin contacto registrado</p>
                    <p className="text-xs text-gray-300 mt-1">Se importa desde el Excel</p>
                  </div>
                )}
              </div>

              {/* Acciones rápidas */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Acciones rápidas</h3>
                <div className="space-y-2">
                  {viajero.celular && (
                    <a href={`/mensajes?viaje=${(viajero.viaje as { id?: string } | null)?.id}`}
                      className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                      <MessageSquare className="w-4 h-4 text-gray-400" /> Enviar mensaje
                    </a>
                  )}
                  <Link href={`/pagos`}
                    className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                    <CreditCard className="w-4 h-4 text-gray-400" /> Registrar abono
                  </Link>
                  <Link href={`/cuartos`}
                    className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                    <BedDouble className="w-4 h-4 text-gray-400" /> Asignar cuarto
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
