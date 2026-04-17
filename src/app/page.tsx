import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  
  // Obtener viajes públicos ordenados por fecha
  const { data: viajes, error } = await supabase
    .from('viajes')
    .select('*')
    .eq('publico', true)
    .eq('activo', true)
    .order('fecha_evento', { ascending: true })
  
  if (error) {
    console.error('Error al cargar viajes:', error)
  }

  // Separar viajes próximos y pasados
  const hoy = new Date()
  const viajesProximos = viajes?.filter(v => new Date(v.fecha_evento) >= hoy) || []
  const viajesPasados = viajes?.filter(v => new Date(v.fecha_evento) < hoy) || []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      {/* Header con colores de marca */}
      <header className="text-white py-6 sticky top-0 z-50 shadow-lg" style={{ backgroundColor: '#000000' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={50} 
                height={50}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#e8ff4c' }}>
                  Conecta Matamoros
                </h1>
                <p className="text-sm" style={{ color: '#ff4bd1' }}>Agencia de Viajes</p>
              </div>
            </div>
            <Link 
              href="/admin"
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: '#88ea4e' }}
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section con gradiente de colores de marca */}
      <section 
        className="text-white py-20"
        style={{
          background: 'linear-gradient(135deg, #0000cd 0%, #ff4bd1 50%, #e8ff4c 100%)'
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 text-black">
            ¡Vive la experiencia de tu vida! 🎉
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-black">
            Viajes organizados a los mejores eventos y conciertos
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="#proximos-viajes"
              className="px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all transform hover:scale-105"
              style={{ backgroundColor: '#ff283b', color: '#ffffff' }}
            >
              Ver Viajes
            </a>
            <a 
              href="https://wa.me/5218683676890" 
              target="_blank"
              className="px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all transform hover:scale-105"
              style={{ backgroundColor: '#88ea4e', color: '#000000' }}
            >
              📱 WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Próximos Viajes */}
      {viajesProximos.length > 0 && (
        <section id="proximos-viajes" className="py-16" style={{ backgroundColor: '#000000' }}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: '#e8ff4c' }}>
              🎪 Próximos Viajes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {viajesProximos.map((viaje) => (
                <ViajeCard key={viaje.id} viaje={viaje} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Viajes Pasados */}
      {viajesPasados.length > 0 && (
        <section className="py-16" style={{ backgroundColor: '#000000' }}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: '#ff4bd1' }}>
              📸 Viajes Realizados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {viajesPasados.map((viaje) => (
                <ViajeCard key={viaje.id} viaje={viaje} pasado={true} />
              ))}
            </div>
          </div>
        </section>
      )}

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
          <h3 className="text-xl font-bold mb-2" style={{ color: '#e8ff4c' }}>
            Conecta Matamoros
          </h3>
          <p className="mb-4" style={{ color: '#ff4bd1' }}>Tu aventura comienza aquí</p>
          <div className="flex gap-6 justify-center mb-6">
            <a href="https://wa.me/5218683676890" style={{ color: '#88ea4e' }} className="hover:opacity-80 transition-opacity">
              📱 WhatsApp
            </a>
            <a href="https://facebook.com" style={{ color: '#0000cd' }} className="hover:opacity-80 transition-opacity">
              Facebook
            </a>
            <a href="https://instagram.com" style={{ color: '#ff4bd1' }} className="hover:opacity-80 transition-opacity">
              Instagram
            </a>
          </div>
          <p className="text-xs" style={{ color: '#888888' }}>
            © 2026 Conecta Matamoros. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

// Componente Card de Viaje con colores de marca
function ViajeCard({ viaje, pasado = false }: { viaje: any, pasado?: boolean }) {
  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div 
        className={`group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 ${pasado ? 'opacity-75' : ''}`}
        style={{ 
          backgroundColor: '#ffffff',
          border: '3px solid #0000cd'
        }}
      >
        {/* Imagen */}
        <div className="relative h-64 overflow-hidden" style={{ backgroundColor: '#000000' }}>
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0000cd 0%, #ff4bd1 100%)'
              }}
            >
              <span className="text-white text-6xl">🎵</span>
            </div>
          )}
          {pasado && (
            <div 
              className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#000000', color: '#e8ff4c' }}
            >
              Finalizado
            </div>
          )}
          {!pasado && (
            <div 
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold animate-pulse"
              style={{ backgroundColor: '#ff283b', color: '#ffffff' }}
            >
              ¡Disponible!
            </div>
          )}
        </div>
        
        {/* Contenido */}
        <div className="p-6" style={{ backgroundColor: '#ffffff' }}>
          <h3 
            className="text-2xl font-bold mb-2 group-hover:opacity-80 transition-opacity"
            style={{ color: '#000000' }}
          >
            {viaje.nombre}
          </h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2" style={{ color: '#0000cd' }}>
              <span className="text-lg">📅</span>
              <span className="font-medium">
                {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
              </span>
            </div>
            
            <div className="flex items-center gap-2" style={{ color: '#ff4bd1' }}>
              <span className="text-lg">📍</span>
              <span>{viaje.ciudad || 'Ciudad por confirmar'}</span>
            </div>
            
            {viaje.venue && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#88ea4e' }}>
                <span className="text-lg">🏟️</span>
                <span>{viaje.venue}</span>
              </div>
            )}
          </div>
          
          <button 
            className="w-full py-3 rounded-lg font-bold text-white hover:opacity-90 transition-all"
            style={{
              background: 'linear-gradient(135deg, #0000cd 0%, #ff4bd1 100%)'
            }}
          >
            Ver Información
          </button>
        </div>
      </div>
    </Link>
  )
}
