import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViajesClient from './ViajesClient'

export default async function ViajesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase
    .from('viajes')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false })

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

  const viajesConStats = (viajes ?? []).map(v => ({
    ...v,
    ...(statsMap.get(v.id) ?? { activos: 0, recaudado: 0, pendiente: 0 })
  }))

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Viajes</h1>
        <p className="text-gray-500 mt-1 text-sm">{viajes?.length ?? 0} viajes registrados</p>
      </div>
      <ViajesClient viajes={viajesConStats} />
    </div>
  )
}
