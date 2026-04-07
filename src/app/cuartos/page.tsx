import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import CuartosClient from './CuartosClient'

export default async function CuartosPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')

  let habitacionesQuery = supabase
    .from('habitaciones')
    .select(`*, asignaciones:asignaciones_cuarto(*, viajero:viajeros(id,nombre,talla,celular))`)
    .order('numero_cuarto')

  if (searchParams.viaje) habitacionesQuery = habitacionesQuery.eq('viaje_id', searchParams.viaje)

  const { data: habitaciones } = await habitacionesQuery

  // Viajeros sin cuarto
  let viajerosSinCuartoQuery = supabase.from('viajeros').select('id,nombre,tipo_habitacion,viaje_id').eq('estado','activo')
  if (searchParams.viaje) viajerosSinCuartoQuery = viajerosSinCuartoQuery.eq('viaje_id', searchParams.viaje)
  const { data: todosViajeros } = await viajerosSinCuartoQuery

  const asignadosIds = new Set((habitaciones ?? []).flatMap(h => (h.asignaciones ?? []).map((a: { viajero_id: string }) => a.viajero_id)))
  const sinCuarto = (todosViajeros ?? []).filter(v => !asignadosIds.has(v.id))

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Cuartos</h1>
            <p className="text-gray-500 mt-1">Asignación de habitaciones por viaje</p>
          </div>
          <CuartosClient
            habitaciones={habitaciones ?? []}
            viajes={viajes ?? []}
            sinCuarto={sinCuarto}
            initialViaje={searchParams.viaje}
          />
        </div>
      </main>
    </div>
  )
}
