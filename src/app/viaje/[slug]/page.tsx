import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ViajeComponent from './ViajeComponent'

export const revalidate = 60

export default async function ViajePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  const { data: viaje } = await supabase
    .from('viajes')
    .select('*')
    .eq('slug', params.slug)
    .eq('publico', true)
    .eq('activo', true)
    .single()
  
  if (!viaje) notFound()
  
  return <ViajeComponent viaje={viaje} />
}
