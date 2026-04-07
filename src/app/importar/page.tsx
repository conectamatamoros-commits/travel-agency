import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import ImportarClient from './ImportarClient'

export default async function ImportarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
  const { data: viajes } = await supabase.from('viajes').select('id,nombre,created_at').eq('activo', true).order('created_at', { ascending: false }).limit(20)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Importar Excel</h1>
            <p className="text-gray-500 mt-1">Carga tus archivos Excel de viajes automáticamente</p>
          </div>
          <ImportarClient viajesExistentes={viajes ?? []} userId={user.id} />
        </div>
      </main>
    </div>
  )
}
