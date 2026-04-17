import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60 // Revalidar cada 60 segundos

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white py-6 sticky top-0 z-50 shadow-lg">
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
                <h1 className="text-2xl md:text-3xl font-bold">Conecta Matamoros</h1>
                <p className="text-sm text-gray-300">Agencia de Viajes</p>
              </div>
            </div>
            <Link 
              href="/admin"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            ¡Vive la experiencia de tu vida! 🎉
          </h2>
          <p className="text-xl md:text-2xl mb-8">
            Viajes organizados a los mejores eventos y conciertos
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="#proximos-viajes"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Ver Viajes
            </a>
            <a 
              href="https://wa.me/5218683676890" 
              target="_blank"
              className="bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition-all transform hover:scale-105"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Próximos Viajes */}
      {viajesProximos.length > 0 && (
        <section id="proximos-viajes" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
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
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-500">
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
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Image 
            src="/blanco con negro.png" 
            alt="Conecta Matamoros" 
            width={80} 
            height={80}
            className="mx-auto mb-4 rounded-lg"
          />
          <h3 className="text-xl font-bold mb-2">Conecta Matamoros</h3>
          <p className="text-gray-400 mb-4">Tu aventura comienza aquí</p>
          <div className="flex gap-6 justify-center mb-6">
            <a href="https://wa.me/5218683676890" className="hover:text-green-400 transition-colors">
              WhatsApp
            </a>
            <a href="https://facebook.com" className="hover:text-blue-400 transition-colors">
              Facebook
            </a>
            <a href="https://instagram.com" className="hover:text-pink-400 transition-colors">
              Instagram
            </a>
          </div>
          <p className="text-xs text-gray-500">
            © 2026 Conecta Matamoros. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

// Componente Card de Viaje
function ViajeCard({ viaje, pasado = false }: { viaje: any, pasado?: boolean }) {
  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div className={`group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 ${pasado ? 'opacity-75' : ''}`}>
        {/* Imagen */}
        <div className="relative h-64 bg-gray-200 overflow-hidden">
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-6xl">🎵</span>
            </div>
          )}
          {pasado && (
            <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold">
              Finalizado
            </div>
          )}
        </div>
        
        {/* Contenido */}
        <div className="p-6 bg-white">
          <h3 className="text-2xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">
            {viaje.nombre}
          </h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">📅</span>
              <span className="font-medium">
                {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">📍</span>
              <span>{viaje.ciudad || 'Ciudad por confirmar'}</span>
            </div>
            
            {viaje.venue && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="text-lg">🏟️</span>
                <span>{viaje.venue}</span>
              </div>
            )}
          </div>
          
          <button className="w-full bg-gradient-to-r from-blue-600 to-pink-500 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-pink-600 transition-all">
            Ver Información
          </button>
        </div>
      </div>
    </Link>
  )
}
