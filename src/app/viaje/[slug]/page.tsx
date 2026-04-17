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

  const precios = viaje.precios || {
    doble: 0,
    triple: 0,
    cuadruple: 0
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Fijo */}
      <header className="bg-black text-white py-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/blanco con negro.png" 
              alt="Conecta Matamoros" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-lg">← Volver</span>
          </Link>
          
          {viaje.whatsapp_inscripcion && (
            <a 
              href={viaje.whatsapp_inscripcion}
              target="_blank"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <span>📱</span>
              <span className="hidden md:inline">Inscríbete Ahora</span>
              <span className="md:hidden">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

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
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white text-9xl">🎵</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {viaje.nombre}
            </h1>
            <div className="flex flex-wrap gap-4 text-white">
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                <span className="text-xl">📅</span>
                <span className="font-bold">
                  {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                <span className="text-xl">📍</span>
                <span className="font-bold">{viaje.ciudad || 'Ciudad por confirmar'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Descripción */}
          {viaje.descripcion && (
            <section className="mb-12">
              <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-8 rounded-2xl">
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                  {viaje.descripcion}
                </p>
              </div>
            </section>
          )}

          {/* Precios */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">💰</span>
              Precios por Habitación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {precios.doble > 0 && (
                <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🛏️</div>
                    <h3 className="text-xl font-bold mb-2">Doble</h3>
                    <p className="text-3xl font-bold">${precios.doble.toLocaleString()}</p>
                    <p className="text-sm mt-2 opacity-90">Por persona</p>
                  </div>
                </div>
              )}
              
              {precios.triple > 0 && (
                <div className="bg-pink-500 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🛏️🛏️</div>
                    <h3 className="text-xl font-bold mb-2">Triple</h3>
                    <p className="text-3xl font-bold">${precios.triple.toLocaleString()}</p>
                    <p className="text-sm mt-2 opacity-90">Por persona</p>
                  </div>
                </div>
              )}
              
              {precios.cuadruple > 0 && (
                <div className="bg-purple-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🛏️🛏️🛏️</div>
                    <h3 className="text-xl font-bold mb-2">Cuádruple</h3>
                    <p className="text-3xl font-bold">${precios.cuadruple.toLocaleString()}</p>
                    <p className="text-sm mt-2 opacity-90">Por persona</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Itinerario */}
          {viaje.itinerario && Array.isArray(viaje.itinerario) && viaje.itinerario.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="text-4xl">🗓️</span>
                Itinerario
              </h2>
              <div className="space-y-4">
                {viaje.itinerario.map((dia: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-2xl border-l-4 border-blue-600">
                    <h3 className="text-xl font-bold text-blue-600 mb-3">
                      {dia.dia || `Día ${index + 1}`}
                    </h3>
                    <ul className="space-y-2">
                      {dia.actividades && dia.actividades.map((actividad: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-blue-600 mt-1">✓</span>
                          <span className="text-gray-700">{actividad}</span>
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
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="text-4xl">✅</span>
                ¿Qué Incluye?
              </h2>
              <div className="bg-green-50 p-8 rounded-2xl">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viaje.incluye.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-600 text-xl mt-0.5">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Lo que NO Incluye */}
          {viaje.no_incluye && viaje.no_incluye.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="text-4xl">❌</span>
                No Incluye
              </h2>
              <div className="bg-red-50 p-8 rounded-2xl">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viaje.no_incluye.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-red-600 text-xl mt-0.5">✗</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Venue Info */}
          {viaje.venue && (
            <section className="mb-12">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <span className="text-3xl">🏟️</span>
                  Lugar del Evento
                </h2>
                <p className="text-xl text-gray-700">{viaje.venue}</p>
              </div>
            </section>
          )}

          {/* Call to Action */}
          {viaje.whatsapp_inscripcion && (
            <section className="mb-12">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-12 rounded-2xl text-center shadow-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  ¿Listo para la aventura? 🎉
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  ¡Aparta tu lugar ahora! Los cupos son limitados.
                </p>
                <a 
                  href={viaje.whatsapp_inscripcion}
                  target="_blank"
                  className="inline-block bg-white text-green-600 px-10 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                >
                  📱 Inscribirme por WhatsApp
                </a>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <Image 
            src="/blanco con negro.png" 
            alt="Conecta Matamoros" 
            width={80} 
            height={80}
            className="mx-auto mb-4 rounded-lg"
          />
          <h3 className="text-xl font-bold mb-2">Conecta Matamoros</h3>
          <p className="text-gray-400 mb-6">Tu aventura comienza aquí</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Volver a todos los viajes
          </Link>
        </div>
      </footer>
    </div>
  )
}
