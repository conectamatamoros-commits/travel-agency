import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { notFound } from 'next/navigation'

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

  const precios = viaje.precios || { doble: 0, triple: 0, cuadruple: 0 }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Fixed Header */}
      <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-sm border-b border-pink-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-pink-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-semibold">Volver</span>
            </Link>
            
            {viaje.whatsapp_inscripcion && (
              <a 
                href={viaje.whatsapp_inscripcion}
                target="_blank"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden sm:inline">Reservar</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[400px] mt-12 overflow-hidden">
        {viaje.imagen_portada ? (
          <Image
            src={viaje.imagen_portada}
            alt={viaje.nombre}
            fill
            className="object-cover object-top"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Conecta Matamoros</span>
              <span>•</span>
              <span>Tour 2026</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}>
              {viaje.nombre}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
              </div>
              {viaje.venue && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {viaje.venue}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 overflow-x-auto">
          <button className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-pink-400 border-b-2 border-pink-400 whitespace-nowrap">
            Precios
          </button>
          <button className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 whitespace-nowrap">
            Incluye
          </button>
        </div>

        {/* Precios Section */}
        <section className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">
            Selecciona tu habitación <span className="text-white normal-case tracking-normal font-semibold">— costos por persona</span>
          </h2>
          
          <div className="grid gap-4">
            {precios.cuadruple > 0 && (
              <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Cuádruple</h3>
                    <p className="text-sm text-gray-400">4 personas · 2 camas matrimoniales</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">${precios.cuadruple.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">por persona</div>
                  </div>
                </div>
              </div>
            )}

            {precios.triple > 0 && (
              <div className="bg-gradient-to-r from-pink-900/30 to-pink-800/30 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-400/50 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Triple</h3>
                    <p className="text-sm text-gray-400">3 personas · 2 camas matrimoniales</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">${precios.triple.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">por persona</div>
                  </div>
                </div>
              </div>
            )}

            {precios.doble > 0 && (
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Doble</h3>
                    <p className="text-sm text-gray-400">2 personas · 1 cama matrimonial</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">${precios.doble.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">por persona</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reserva Strip */}
          <div className="mt-8 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-gray-400 tracking-wider mb-1">Reservación desde</div>
              <div className="text-4xl font-bold text-white mb-1">$500</div>
              <div className="text-xs text-gray-400">por persona · abonos mensuales</div>
            </div>
            <div className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold text-sm">
              APARTAR
            </div>
          </div>
        </section>

        {/* Lo que incluye */}
        {viaje.incluye && viaje.incluye.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">
              Tu paquete incluye
            </h2>
            <div className="space-y-3">
              {viaje.incluye.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
                  <div className="text-gray-300">{item}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WhatsApp CTA */}
        {viaje.whatsapp_inscripcion && (
          <div className="sticky bottom-4">
            <a 
              href={viaje.whatsapp_inscripcion}
              target="_blank"
              className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-4 rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Quiero reservar mi lugar
            </a>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Sin reembolso después del 1er pago · © Conecta Matamoros
        </div>
      </div>
    </div>
  )
}
