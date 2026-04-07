import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MensajesClient from './MensajesClient'

export default async function MensajesPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('nombre,rol').eq('id', user.id).single()
  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')

  let viajerosQuery = supabase.from('viajeros')
    .select('id,nombre,celular,correo,total_pagado,saldo_pendiente,tipo_habitacion,seccion_boleto,viaje_id,viaje:viajes(nombre)')
    .eq('estado', 'activo')
    .order('nombre')

  if (searchParams.viaje) viajerosQuery = viajerosQuery.eq('viaje_id', searchParams.viaje)

  const { data: viajeros } = await viajerosQuery
  const { data: mensajesLog } = await supabase.from('mensajes_log').select('*').order('created_at', { ascending: false }).limit(50)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={profile?.nombre ?? user.email ?? ''} userRol={profile?.rol ?? 'staff'} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Centro de Mensajes</h1>
            <p className="text-gray-500 mt-1">Envía mensajes a clientes por WhatsApp o correo</p>
          </div>
          <MensajesClient
            viajeros={viajeros ?? []}
            viajes={viajes ?? []}
            mensajesLog={mensajesLog ?? []}
            currentUserId={user.id}
            initialViaje={searchParams.viaje}
          />
        </div>
      </main>
    </div>
  )
}
