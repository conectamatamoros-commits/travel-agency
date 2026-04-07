import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MensajesClient from './MensajesClient'

export default async function MensajesPage({ searchParams }: { searchParams: { viaje?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase.from('viajes').select('id,nombre').eq('activo', true).order('nombre')

  let viajerosQuery = supabase.from('viajeros')
    .select('id,nombre,celular,correo,total_pagado,saldo_pendiente,tipo_habitacion,seccion_boleto,viaje_id,viaje:viajes(nombre)')
    .eq('estado', 'activo')
    .order('nombre')

  if (searchParams.viaje) viajerosQuery = viajerosQuery.eq('viaje_id', searchParams.viaje)

  const { data: viajeros } = await viajerosQuery
  const { data: mensajesLog } = await supabase.from('mensajes_log').select('*').order('created_at', { ascending: false }).limit(50)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-gray-500 mt-1 text-sm">Envía mensajes por WhatsApp o correo</p>
      </div>
      <MensajesClient
        viajeros={viajeros ?? []}
        viajes={viajes ?? []}
        mensajesLog={mensajesLog ?? []}
        currentUserId={user.id}
        initialViaje={searchParams.viaje}
      />
    </div>
  )
}
