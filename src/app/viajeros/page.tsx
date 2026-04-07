import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { Users, Phone, Mail, Search, Filter, ChevronRight } from 'lucide-react'
import ViajerosClient from './ViajerosClient'

export default async function ViajerosPage({ searchParams }: { searchParams: { viaje?: string; pendiente?: string; q?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Viajeros</h1>
              <p className="text-gray-500 mt-1">{filtered.length} viajeros{searchParams.viaje ? ' en este viaje' : ''}</p>
            </div>
          </div>
          <ViajerosClient viajeros={filtered} viajes={viajes ?? []} initialViaje={searchParams.viaje} initialPendiente={searchParams.pendiente === 'true'} initialQ={searchParams.q} />
        </div>
      </main>
    </div>
  )
}
