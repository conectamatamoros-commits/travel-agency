import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PagosClient from './PagosClient'

export default async function PagosPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')

  let query = supabase.from('viajeros')
    .select('id,nombre,celular,correo,total_pagado,total_costo,saldo_pendiente,tipo_habitacion,seccion_boleto,viaje_id,viaje:viajes(nombre)')
    .eq('estado', 'activo')
    .order('saldo_pendiente', { ascending: false })

  if (searchParams.viaje) query = query.eq('viaje_id', searchParams.viaje)

  const { data: viajeros } = await query
  const { data: abonos } = await supabase.from('abonos').select('*').order('created_at')

  const abonosPorViajero = new Map<string, typeof abonos>()
  for (const a of abonos ?? []) {
    if (!abonosPorViajero.has(a.viajero_id)) abonosPorViajero.set(a.viajero_id, [])
    abonosPorViajero.get(a.viajero_id)!.push(a)
  }

  const totalRecaudado = (viajeros ?? []).reduce((s, v) => s + (v.total_pagado || 0), 0)
  const totalPendiente = (viajeros ?? []).reduce((s, v) => s + (v.saldo_pendiente || 0), 0)

  function fmt(n: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-500 mt-1 text-sm">Control financiero por viajero</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Recaudado', value: fmt(totalRecaudado), color: 'text-green-600' },
          { label: 'Pendiente', value: fmt(totalPendiente), color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
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
  )
}
