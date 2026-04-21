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
    <div className="min-h-screen bg-black text-white">
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">← Volver</h1>
              </div>
            </Link>
            
            {viaje.whatsapp_inscripcion && (
              <a 
                href={viaje.whatsapp_inscripcion}
                target="_blank"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2"
              >
                <span>📱</span>
                <span className="hidden md:inline">Reservar</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16"></div>

      {/* Hero Image */}
      <div className="relative h-[50vh] md:h-[60vh] bg-gray-900">
        {viaje.imagen_portada ? (
          <Image
            src={viaje.imagen_portada}
            alt={viaje.nombre}
            fill
            className="object-cover opacity-90"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-500 via-pink-500 to-blue-500 flex items-center justify-center">
            <span className="text-9xl">🎵</span>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        
        {/* Título sobre imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              {viaje.nombre}
            </h1>
            <div className="flex flex-wrap gap-4 text-white">
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur">
                <span>📅</span>
                <span className="font-bold text-sm">
                  {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur">
                <span>📍</span>
                <span className="font-bold text-sm">{viaje.ciudad || 'Ciudad'}</span>
              </div>
              {viaje.venue && (
                <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur">
                  <span>🏟️</span>
                  <span className="font-bold text-sm">{viaje.venue}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        
        {/* Descripción */}
        {viaje.descripcion && (
          <section className="mb-12">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl">
              <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                {viaje.descripcion}
              </p>
            </div>
          </section>
        )}

        {/* Precios */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">💰 Precios por Habitación</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {precios.cuadruple > 0 && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white transform hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-3">🛏️🛏️🛏️</div>
                  <h3 className="text-2xl font-bold mb-2">Cuádruple</h3>
                  <p className="text-sm opacity-90 mb-4">4 personas<br/>2 camas matrimoniales</p>
                  <p className="text-4xl font-black">${precios.cuadruple.toLocaleString()}</p>
                  <p className="text-sm mt-2 opacity-75">por persona</p>
                </div>
              </div>
            )}
            
            {precios.triple > 0 && (
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-2xl text-white transform hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-3">🛏️🛏️</div>
                  <h3 className="text-2xl font-bold mb-2">Triple</h3>
                  <p className="text-sm opacity-90 mb-4">3 personas<br/>2 camas matrimoniales</p>
                  <p className="text-4xl font-black">${precios.triple.toLocaleString()}</p>
                  <p className="text-sm mt-2 opacity-75">por persona</p>
                </div>
              </div>
            )}
            
            {precios.doble > 0 && (
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white transform hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-3">🛏️</div>
                  <h3 className="text-2xl font-bold mb-2">Doble</h3>
                  <p className="text-sm opacity-90 mb-4">2 personas<br/>1 cama matrimonial</p>
                  <p className="text-4xl font-black">${precios.doble.toLocaleString()}</p>
                  <p className="text-sm mt-2 opacity-75">por persona</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Itinerario */}
        {viaje.itinerario && Array.isArray(viaje.itinerario) && viaje.itinerario.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">🗓️ Itinerario</h2>
            <div className="space-y-4">
              {viaje.itinerario.map((dia: any, index: number) => (
                <div key={index} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold text-red-500 mb-3">
                    {dia.dia || `Día ${index + 1}`}
                  </h3>
                  <ul className="space-y-2">
                    {dia.actividades && dia.actividades.map((actividad: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300">
                        <span className="text-red-500 mt-1">✓</span>
                        <span>{actividad}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lo que Incluye */}
        {viaje.incluye && viaje.incluye.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">✅ ¿Qué Incluye?</h2>
            <div className="bg-green-900/20 border border-green-800 p-8 rounded-2xl">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viaje.incluye.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span className="text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Lo que NO Incluye */}
        {viaje.no_incluye && viaje.no_incluye.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">❌ No Incluye</h2>
            <div className="bg-red-900/20 border border-red-800 p-8 rounded-2xl">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viaje.no_incluye.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-red-400 text-xl mt-0.5">✗</span>
                    <span className="text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* CTA Final */}
        {viaje.whatsapp_inscripcion && (
          <section className="mb-12">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-12 rounded-2xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para la aventura? 🎉
              </h2>
              <p className="text-xl mb-8 opacity-90">
                ¡Aparta tu lugar ahora! Los cupos son limitados.
              </p>
              <a 
                href={viaje.whatsapp_inscripcion}
                target="_blank"
                className="inline-block bg-white text-green-600 px-10 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                📱 Reservar por WhatsApp
              </a>
            </div>
          </section>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 mt-20">
        <div className="container mx-auto max-w-4xl text-center">
          <Image 
            src="/blanco con negro.png" 
            alt="Conecta Matamoros" 
            width={80} 
            height={80}
            className="mx-auto mb-4 rounded-lg"
          />
          <h3 className="text-xl font-bold mb-2">Conecta Matamoros</h3>
          <p className="text-gray-400 mb-6">Tu aventura comienza aquí</p>
          <Link href="/" className="text-red-500 hover:text-red-400 transition-colors font-bold">
            ← Volver a todos los viajes
          </Link>
        </div>
      </footer>
    </div>
  )
}
