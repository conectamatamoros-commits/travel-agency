import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportesClient from './ReportesClient'

export default async function ReportesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: abonos } = await supabase
    .from('abonos')
    .select('*, viajero:viajeros(nombre, viaje_id, viaje:viajes(nombre))')
    .order('created_at', { ascending: false })

  const { data: viajes } = await supabase
    .from('viajes')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1 text-sm">Control de ingresos por período</p>
      </div>
      <ReportesClient abonos={abonos ?? []} viajes={viajes ?? []} />
    </div>
  )
}
