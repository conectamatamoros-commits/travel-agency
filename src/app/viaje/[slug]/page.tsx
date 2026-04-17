import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

interface Props {
  params: {
    slug: string
  }
}

// Mapeo de slugs a nombres de archivos HTML (usando los nombres reales de GitHub)
const htmlMap: Record<string, string> = {
  'young-miko-monterrey-2026': 'informacion-tour-young-miko.html',
  'morat-monterrey-2026': 'informacion-tour-morat.html',
  'ricardo-arjona-monterrey-2025': 'informacion-tour-arjona.html',
  'siddhartha-monterrey-2026': 'informacion-tour-siddhartha.html',
  'kenia-os-monterrey-2026': 'informacion-tour-kenia-os.html'
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

  // Obtener el nombre del archivo HTML correspondiente
  const htmlFile = htmlMap[params.slug]

  if (!htmlFile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header con botón de volver */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white hover:text-pink-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Volver a todos los eventos</span>
          </Link>
        </div>
      </div>

      {/* Contenedor para el HTML */}
      <div className="pt-14">
        {/* Wrapper para centrar en desktop */}
        <div className="mx-auto" style={{ maxWidth: '440px' }}>
          <iframe
            src={`/eventos/${htmlFile}`}
            className="w-full border-0"
            style={{ 
              height: '100vh',
              minHeight: '800px'
            }}
            title={viaje.nombre}
          />
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .mx-auto {
            box-shadow: 0 0 50px rgba(233, 30, 140, 0.3);
          }
        }
      `}</style>
    </div>
  )
}
