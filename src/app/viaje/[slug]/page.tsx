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

  // Obtener precios desde la tabla si existe, o usar un objeto por defecto
  const precios = viaje.precios || {
    doble: 0,
    triple: 0,
    cuadruple: 0
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      {/* Header Fijo con colores de marca */}
      <header className="text-white py-4 sticky top-0 z-50 shadow-lg" style={{ backgroundColor: '#000000', borderBottom: '3px solid #0000cd' }}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/blanco con negro.png" 
              alt="Conecta Matamoros" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-lg" style={{ color: '#e8ff4c' }}>← Volver</span>
          </Link>
          
          {viaje.whatsapp_inscripcion && (
            <a 
              href={viaje.whatsapp_inscripcion}
              target="_blank"
              className="px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2"
              style={{ backgroundColor: '#88ea4e', color: '#000000' }}
            >
              <span>📱</span>
              <span className="hidden md:inline">Inscríbete Ahora</span>
              <span className="md:hidden">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-[50vh] md:h-[60vh]" style={{ backgroundColor: '#000000' }}>
        {viaje.imagen_portada ? (
          <Image
            src={viaje.imagen_portada}
            alt={viaje.nombre}
            fill
            className="object-cover opacity-90"
            priority
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0000cd 0%, #ff4bd1 50%, #e8ff4c 100%)'
            }}
          >
            <span className="text-white text-9xl">🎵</span>
          </div>
        )}
        
        {/* Overlay con título */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: '#e8ff4c' }}>
              {viaje.nombre}
            </h1>
            <div className="flex flex-wrap gap-4 text-white">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(0, 0, 205, 0.8)' }}>
                <span className="text-xl">📅</span>
                <span className="font-bold">
                  {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 75, 209, 0.8)' }}>
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
              <div className="p-8 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '3px solid #0000cd' }}>
                <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: '#000000' }}>
                  {viaje.descripcion}
                </p>
              </div>
            </section>
          )}

          {/* Precios */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: '#e8ff4c' }}>
              <span className="text-4xl">💰</span>
              Precios por Habitación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {precios.doble > 0 && (
                <div className="text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform" style={{ backgroundColor: '#0000cd' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🛏️</div>
                    <h3 className="text-xl font-bold mb-2">Doble</h3>
                    <p className="text-3xl font-bold">${precios.doble.toLocaleString()}</p>
                    <p className="text-sm mt-2 opacity-90">Por persona</p>
                  </div>
                </div>
              )}
              
              {precios.triple > 0 && (
                <div className="text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform" style={{ backgroundColor: '#ff4bd1' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🛏️🛏️</div>
                    <h3 className="text-xl font-bold mb-2">Triple</h3>
                    <p className="text-3xl font-bold">${precios.triple.toLocaleString()}</p>
                    <p className="text-sm mt-2 opacity-90">Por persona</p>
                  </div>
                </div>
              )}
              
              {precios.cuadruple > 0 && (
                <div className="text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform" style={{ backgroundColor: '#88ea4e', color: '#000000' }}>
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
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: '#e8ff4c' }}>
                <span className="text-4xl">🗓️</span>
                Itinerario
              </h2>
              <div className="space-y-4">
                {viaje.itinerario.map((dia: any, index: number) => (
                  <div key={index} className="p-6 rounded-2xl" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #0000cd' }}>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#0000cd' }}>
                      {dia.dia || `Día ${index + 1}`}
                    </h3>
                    <ul className="space-y-2">
                      {dia.actividades && dia.actividades.map((actividad: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span style={{ color: '#88ea4e' }} className="mt-1">✓</span>
                          <span style={{ color: '#000000' }}>{actividad}</span>
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
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: '#e8ff4c' }}>
                <span className="text-4xl">✅</span>
                ¿Qué Incluye?
              </h2>
              <div className="p-8 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '3px solid #88ea4e' }}>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viaje.incluye.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-xl mt-0.5" style={{ color: '#88ea4e' }}>✓</span>
                      <span style={{ color: '#000000' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Lo que NO Incluye */}
          {viaje.no_incluye && viaje.no_incluye.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: '#e8ff4c' }}>
                <span className="text-4xl">❌</span>
                No Incluye
              </h2>
              <div className="p-8 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '3px solid #ff283b' }}>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viaje.no_incluye.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-xl mt-0.5" style={{ color: '#ff283b' }}>✗</span>
                      <span style={{ color: '#000000' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Venue Info */}
          {viaje.venue && (
            <section className="mb-12">
              <div className="p-8 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '3px solid #ff4bd1' }}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: '#ff4bd1' }}>
                  <span className="text-3xl">🏟️</span>
                  Lugar del Evento
                </h2>
                <p className="text-xl" style={{ color: '#000000' }}>{viaje.venue}</p>
              </div>
            </section>
          )}

          {/* Call to Action */}
          {viaje.whatsapp_inscripcion && (
            <section className="mb-12">
              <div className="p-12 rounded-2xl text-center shadow-2xl text-white" style={{ backgroundColor: '#88ea4e', color: '#000000' }}>
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#000000' }}>
                  ¿Listo para la aventura? 🎉
                </h2>
                <p className="text-xl mb-8" style={{ color: '#000000' }}>
                  ¡Aparta tu lugar ahora! Los cupos son limitados.
                </p>
                <a 
                  href={viaje.whatsapp_inscripcion}
                  target="_blank"
                  className="inline-block px-10 py-4 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                  style={{ backgroundColor: '#000000', color: '#e8ff4c' }}
                >
                  📱 Inscribirme por WhatsApp
                </a>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-12" style={{ backgroundColor: '#000000', borderTop: '3px solid #0000cd' }}>
        <div className="container mx-auto px-4 text-center">
          <Image 
            src="/blanco con negro.png" 
            alt="Conecta Matamoros" 
            width={80} 
            height={80}
            className="mx-auto mb-4 rounded-lg"
          />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#e8ff4c' }}>Conecta Matamoros</h3>
          <p className="mb-6" style={{ color: '#ff4bd1' }}>Tu aventura comienza aquí</p>
          <Link href="/" style={{ color: '#88ea4e' }} className="hover:opacity-80 transition-opacity">
            ← Volver a todos los viajes
          </Link>
        </div>
      </footer>
    </div>
  )
}
