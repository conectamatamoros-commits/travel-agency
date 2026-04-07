import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CuartosClient from './CuartosClient'

export default async function CuartosPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')

  let habitacionesQuery = supabase
    .from('habitaciones')
    .select('*, asignaciones:asignaciones_cuarto(*, viajero:viajeros(id,nombre,talla,celular))')
    .order('numero_cuarto')

  if (searchParams.viaje) habitacionesQuery = habitacionesQuery.eq('viaje_id', searchParams.viaje)

  const { data: habitaciones } = await habitacionesQuery

  let viajerosSinCuartoQuery = supabase.from('viajeros').select('id,nombre,tipo_habitacion,viaje_id').eq('estado','activo')
  if (searchParams.viaje) viajerosSinCuartoQuery = viajerosSinCuartoQuery.eq('viaje_id', searchParams.viaje)
  const { data: todosViajeros } = await viajerosSinCuartoQuery

  const asignadosIds = new Set((habitaciones ?? []).flatMap(h => (h.asignaciones ?? []).map((a: { viajero_id: string }) => a.viajero_id)))
  const sinCuarto = (todosViajeros ?? []).filter(v => !asignadosIds.has(v.id))

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Cuartos</h1>
        <p className="text-gray-500 mt-1 text-sm">Asignación de habitaciones por viaje</p>
      </div>
      <CuartosClient
        habitaciones={habitaciones ?? []}
        viajes={viajes ?? []}
        sinCuarto={sinCuarto}
        initialViaje={searchParams.viaje}
      />
    </div>
  )
}
