import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TareasClient from './TareasClient'

export default async function TareasPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')
  const { data: usuarios } = await supabase.from('user_profiles').select('id,nombre,rol').eq('activo', true)

  let query = supabase.from('tareas')
    .select('*, viaje:viajes(nombre), asignado:user_profiles!tareas_asignado_a_fkey(nombre)')
    .order('created_at', { ascending: false })

  if (searchParams.viaje) query = query.eq('viaje_id', searchParams.viaje)

  const { data: tareas } = await query

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
            <p className="text-gray-500 mt-1">Gestión de pendientes del equipo</p>
          </div>
          <TareasClient
            tareas={tareas ?? []}
            viajes={viajes ?? []}
            usuarios={usuarios ?? []}
            currentUserId={user.id}
            initialViaje={searchParams.viaje}
          />
        </div>
      </main>
    </div>
  )
}
