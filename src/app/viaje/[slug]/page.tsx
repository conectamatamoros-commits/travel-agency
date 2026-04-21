import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const revalidate = 60

interface Props {
  params: {
    slug: string
  }
}

export default async function ViajePage({ params }: Props) {
  const supabase = await createClient()
  
  // Verificar que el viaje existe en la BD
  const { data: viaje, error } = await supabase
    .from('viajes')
    .select('slug')
    .eq('slug', params.slug)
    .eq('publico', true)
    .single()
  
  if (error || !viaje) {
    notFound()
  }

  // Cargar el HTML estático correspondiente
  const htmlUrl = `/eventos/${params.slug}.html`

  return (
    <div className="min-h-screen bg-black">
      <iframe 
        src={htmlUrl}
        className="w-full h-screen border-0"
        title={`Evento ${params.slug}`}
      />
    </div>
  )
}
