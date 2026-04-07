import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViajerosClient from './ViajerosClient'

export default async function ViajerosPage({ searchParams }: { searchParams: { viaje?: string; pendiente?: string; q?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')

  let query = supabase.from('viajeros')
    .select('*, viaje:viajes(nombre)')
    .eq('estado', 'activo')
    .order('nombre')

  if (searchParams.viaje) query = query.eq('viaje_id', searchParams.viaje)
  if (searchParams.pendiente === 'true') query = query.gt('saldo_pendiente', 0)

  const { data: viajeros } = await query
  const filtered = searchParams.q
    ? (viajeros ?? []).filter(v => v.nombre.toLowerCase().includes(searchParams.q!.toLowerCase()))
    : (viajeros ?? [])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Viajeros</h1>
        <p className="text-gray-500 mt-1 text-sm">{filtered.length} viajeros registrados</p>
      </div>
      <ViajerosClient
        viajeros={filtered}
        viajes={viajes ?? []}
        initialViaje={searchParams.viaje}
        initialPendiente={searchParams.pendiente === 'true'}
        initialQ={searchParams.q}
      />
    </div>
  )
}
