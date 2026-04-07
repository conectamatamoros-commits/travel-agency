import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={profile?.nombre ?? user.email ?? 'Usuario'} userRol={profile?.rol ?? 'staff'} />
      {/* Desktop: margen izquierdo para el sidebar */}
      {/* Mobile: padding top para la barra superior y bottom para la nav inferior */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
