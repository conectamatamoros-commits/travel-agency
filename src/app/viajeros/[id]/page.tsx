import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ViajeroDetalle from './ViajeroDetalle'

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

  const [{ data: abonos }, { data: contacto }, { data: asignacion }] = await Promise.all([
    supabase.from('abonos').select('*').eq('viajero_id', params.id).order('numero_abono'),
    supabase.from('contactos_emergencia').select('*').eq('viajero_id', params.id).single(),
    supabase.from('asignaciones_cuarto').select('*, habitacion:habitaciones(numero_cuarto,tipo)').eq('viajero_id', params.id).single(),
  ])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
            <Link href="/viajeros" className="hover:text-gray-600 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Viajeros
            </Link>
            <span>/</span>
            <span className="text-gray-700">{viajero.nombre}</span>
          </div>
          <ViajeroDetalle
            viajero={viajero}
            abonos={abonos ?? []}
            contacto={contacto}
            asignacion={asignacion}
          />
        </div>
      </main>
    </div>
  )
}
