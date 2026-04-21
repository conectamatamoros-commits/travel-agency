import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ViajeComponent from './ViajeComponent'

export const revalidate = 60

interface Props {
  params: {
    slug: string
  }
}

export default async function ViajePage({ params }: Props) {
  const supabase = await createClient()
  
  const { data: viaje, error } = await supabase
    .from('viajes')
    .select('*')
    .eq('slug', params.slug)
    .eq('publico', true)
    .single()
  
  if (error || !viaje) {
    notFound()
  }

  return <ViajeComponent viaje={viaje} />
}
