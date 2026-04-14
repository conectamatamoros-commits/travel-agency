import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import PagosClient from './PagosClient'

export default async function PagosPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')

  let query = supabase.from('viajeros')
    .select('id,nombre,celular,correo,total_pagado,total_costo,saldo_pendiente,tipo_habitacion,seccion_boleto,viaje_id,viaje:viajes(nombre)')
    .eq('estado', 'activo')
    .order('saldo_pendiente', { ascending: false })

  if (searchParams.viaje) query = query.eq('viaje_id', searchParams.viaje)

  const { data: viajeros } = await query
  const { data: abonos } = await supabase.from('abonos').select('*').order('created_at')

  // Group abonos by viajero
  const abonosPorViajero = new Map<string, typeof abonos>()
  for (const a of abonos ?? []) {
    if (!abonosPorViajero.has(a.viajero_id)) abonosPorViajero.set(a.viajero_id, [])
    abonosPorViajero.get(a.viajero_id)!.push(a)
  }

  const totalRecaudado = (viajeros ?? []).reduce((s, v) => s + (v.total_pagado || 0), 0)
  const totalPendiente = (viajeros ?? []).reduce((s, v) => s + (v.saldo_pendiente || 0), 0)
  const totalCosto = (viajeros ?? []).reduce((s, v) => s + (v.total_costo || 0), 0)
  const viajerosPagados = (viajeros ?? []).filter(v => (v.saldo_pendiente || 0) <= 0).length

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Pagos y Abonos</h1>
            <p className="text-gray-500 mt-1">Control financiero por viajero</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total recaudado', value: new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(totalRecaudado), color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total pendiente', value: new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(totalPendiente), color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Total esperado', value: new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(totalCosto), color: 'text-gray-700', bg: 'bg-gray-50' },
              { label: 'Viajeros al corriente', value: `${viajerosPagados} / ${(viajeros??[]).length}`, color: 'text-brand-700', bg: 'bg-brand-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="card p-5">
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <PagosClient 
            viajeros={viajeros ?? []} 
            viajes={viajes ?? []} 
            abonosPorViajero={Object.fromEntries(abonosPorViajero)}
            initialViaje={searchParams.viaje}
          />
        </div>
      </main>
    </div>
  )
}
