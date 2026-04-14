import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: viajes, error } = await supabase
    .from('viajes')
    .select('*')
    .eq('publico', true)
    .eq('activo', true)
    .order('fecha_evento', { ascending: true })
  
  if (error) {
    console.error('Error al cargar viajes:', error)
  }

  const hoy = new Date()
  const viajesProximos = viajes?.filter(v => new Date(v.fecha_evento) >= hoy) || []
  const viajesPasados = viajes?.filter(v => new Date(v.fecha_evento) < hoy) || []

  return (
    <div className="min-h-screen bg-white font-['Montserrat',sans-serif]">
      {/* Header */}
      <header className="bg-black text-white py-4 sticky top-0 z-50 shadow-lg border-b-4 border-[#ff4bd1]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta MX" 
                width={50} 
                height={50}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{fontFamily: 'Kaneda Gothic, sans-serif'}}>
                  CONECTA MX
                </h1>
                <p className="text-xs text-gray-300 font-medium">AGENCIA DE VIAJES</p>
              </div>
            </div>
            <Link 
              href="/admin"
              className="text-xs text-gray-400 hover:text-[#e8ff4c] transition-colors font-medium"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative py-20 md:py-32 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #0000cd 50%, #ff4bd1 100%)'
        }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight" style={{fontFamily: 'Kaneda Gothic, sans-serif'}}>
            ¡VIVE LA EXPERIENCIA<br />DE TU VIDA! 🎉
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-white font-bold">
            Viajes organizados a los mejores eventos y conciertos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#proximos-viajes"
              className="bg-[#e8ff4c] text-black px-8 py-4 rounded-none font-black text-lg hover:bg-[#88ea4e] transition-all transform hover:scale-105 shadow-lg"
              style={{fontFamily: 'Kaneda Gothic, sans-serif'}}
            >
              VER VIAJES
            </a>
            <a 
              href="https://wa.me/528681234567" 
              target="_blank"
              className="bg-[#88ea4e] text-black px-8 py-4 rounded-none font-black text-lg hover:bg-[#e8ff4c] transition-all transform hover:scale-105 shadow-lg"
              style={{fontFamily: 'Kaneda Gothic, sans-serif'}}
            >
              WHATSAPP
            </a>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#ff4bd1] opacity-20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#e8ff4c] opacity-20 rounded-full"></div>
      </section>

      {/* Próximos Viajes */}
      {viajesProximos.length > 0 && (
        <section id="proximos-viajes" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-12 text-black" style={{fontFamily: 'Kaneda Gothic, sans-serif'}}>
              🎪 PRÓXIMOS VIAJES
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
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-gray-600" style={{fontFamily: 'Kaneda Gothic, sans-serif'}}>
              📸 VIAJES REALIZADOS
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
      <footer className="bg-black text-white py-12 border-t-4 border-[#0000cd]">
        <div className="container mx-auto px-4 text-center">
          <Image 
            src="/blanco con negro.png" 
            alt="Conecta MX" 
            width={80} 
            height={80}
            className="mx-auto mb-4 rounded-lg"
          />
          <h3 className="text-2xl font-black mb-2" style={{fontFamily: 'Kaneda Gothic, sans-serif'}}>CONECTA MX</h3>
          <p className="text-gray-400 mb-6 font-medium">Tu aventura comienza aquí</p>
          <div className="flex gap-6 justify-center mb-6">
            <a href="https://wa.me/528681234567" className="hover:text-[#88ea4e] transition-colors font-bold">
              WhatsApp
            </a>
            <a href="https://facebook.com" className="hover:text-[#0000cd] transition-colors font-bold">
              Facebook
            </a>
            <a href="https://instagram.com" className="hover:text-[#ff4bd1] transition-colors font-bold">
              Instagram
            </a>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            © 2026 Conecta MX. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

function ViajeCard({ viaje, pasado = false }: { viaje: any, pasado?: boolean }) {
  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div className={`group cursor-pointer rounded-none overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-black ${pasado ? 'opacity-75' : ''}`}>
        {/* Imagen */}
        <div className="relative h-64 bg-gray-900 overflow-hidden">
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0000cd] to-[#ff4bd1] flex items-center justify-center">
              <span className="text-white text-6xl">🎵</span>
            </div>
          )}
          {pasado && (
            <div className="absolute top-4 right-4 bg-black text-[#e8ff4c] px-3 py-1 font-black text-xs">
              FINALIZADO
            </div>
          )}
        </div>
        
        {/* Contenido */}
        <div className="p-6 bg-white border-t-4 border-[#ff4bd1]">
          <h3 className="text-2xl font-black mb-3 text-black group-hover:text-[#0000cd] transition-colors" style={{fontFamily: 'Kaneda Gothic, sans-serif'}}>
            {viaje.nombre}
          </h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-700 font-bold">
              <span className="text-lg">📅</span>
              <span className="text-sm">
                {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700 font-bold">
              <span className="text-lg">📍</span>
              <span className="text-sm">{viaje.ciudad || 'Ciudad por confirmar'}</span>
            </div>
            
            {viaje.venue && (
              <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                <span className="text-lg">🏟️</span>
                <span>{viaje.venue}</span>
              </div>
            )}
          </div>
          
          <button className="w-full bg-black text-[#e8ff4c] py-3 font-black hover:bg-[#0000cd] hover:text-white transition-all border-2 border-black">
            VER INFORMACIÓN
          </button>
        </div>
      </div>
    </Link>
  )
}
