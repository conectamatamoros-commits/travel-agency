import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-black relative">
      {/* Botón Regresar Flotante - MUY VISIBLE */}
      <Link 
        href="/"
        className="fixed top-4 left-4 md:top-6 md:left-6 z-[99999] bg-black text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-black text-sm md:text-base hover:bg-red-500 transition-all border-2 border-red-500 shadow-2xl hover:scale-105 flex items-center gap-2"
        style={{ zIndex: 99999 }}
      >
        <span className="text-xl">←</span>
        <span>Volver</span>
      </Link>

      {/* Iframe con el HTML estático */}
      <iframe 
        src={htmlUrl}
        className="w-full h-screen border-0"
        title={`Evento ${params.slug}`}
        style={{ position: 'relative', zIndex: 1 }}
      />
    </div>
  )
}
