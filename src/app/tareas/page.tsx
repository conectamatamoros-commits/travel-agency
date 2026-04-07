import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TareasClient from './TareasClient'

export default async function TareasPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')
  const { data: usuarios } = await supabase.from('user_profiles').select('id,nombre,rol').eq('activo', true)

  let query = supabase.from('tareas')
    .select('*, viaje:viajes(nombre), asignado:user_profiles!tareas_asignado_a_fkey(nombre)')
    .order('created_at', { ascending: false })

  if (searchParams.viaje) query = query.eq('viaje_id', searchParams.viaje)
  const { data: tareas } = await query

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tareas</h1>
        <p className="text-gray-500 mt-1 text-sm">Gestión de pendientes del equipo</p>
      </div>
      <TareasClient
        tareas={tareas ?? []}
        viajes={viajes ?? []}
        usuarios={usuarios ?? []}
        currentUserId={(await supabase.auth.getUser()).data.user?.id ?? ''}
        initialViaje={searchParams.viaje}
      />
    </div>
  )
}
