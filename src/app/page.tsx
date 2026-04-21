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
  const proximoEvento = viajesProximos[0]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">CONECTA</h1>
                <p className="text-xs text-gray-400">MX.</p>
              </div>
            </div>
            <Link 
              href="/admin"
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer para header fijo */}
      <div className="h-16"></div>

      {/* Hero Section con Marquee */}
      <section className="relative overflow-hidden border-b border-gray-800">
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-blue-500 py-3">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-sm font-bold mx-8">Conecta Matamoros</span>
            <span className="text-sm mx-8">Tours a conciertos</span>
            <span className="text-sm mx-8">Desde Matamoros · Tamaulipas</span>
            <span className="text-sm font-bold mx-8">Paga en quincenas</span>
            <span className="text-sm mx-8">Boletos oficiales</span>
            <span className="text-sm font-bold mx-8">Conecta Matamoros</span>
            <span className="text-sm mx-8">Tours a conciertos</span>
            <span className="text-sm mx-8">Desde Matamoros · Tamaulipas</span>
          </div>
        </div>
      </section>

      {/* Main Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm text-gray-400 mb-2">Conecta Matamoros · Catálogo 2026</p>
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Viaja con expertos
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Agencia de viajes desde Matamoros. Transporte, hospedaje, boletos y kit Conecta — todo resuelto. 
            Escoge tu evento, elige paquete y paga en quincenas sin estrés.
          </p>

          {/* Contador Próximo Evento */}
          {proximoEvento && (
            <div className="mb-12">
              <p className="text-sm text-gray-400 mb-4">Próximo evento</p>
              <div className="flex justify-center gap-4 mb-8">
                <CountdownTimer targetDate={proximoEvento.fecha_evento} />
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a 
              href="#catalog-anchor"
              className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-all"
            >
              Ver eventos →
            </a>
          </div>

          {/* Links rápidos */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <a href="https://wa.me/5218683676890" className="text-gray-400 hover:text-white transition-colors">
              ¿Cómo funciona? →
            </a>
            <a href="https://wa.me/5218683676890" className="text-gray-400 hover:text-white transition-colors">
              Preguntas frecuentes →
            </a>
            <a href="https://wa.me/5218683676890" className="text-gray-400 hover:text-white transition-colors">
              Kit Conecta →
            </a>
          </div>
        </div>
      </section>

      {/* Filtros de Eventos */}
      <section id="catalog-anchor" className="border-t border-gray-800 py-8 px-4 sticky top-16 bg-black z-40">
        <div className="container mx-auto">
          <h3 className="text-sm font-bold mb-4">🔥 LOS MÁS BUSCADOS</h3>
          <EventFilters />
        </div>
      </section>

      {/* Grid de Eventos */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viajesProximos.map((viaje) => (
              <EventCard key={viaje.id} viaje={viaje} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image 
                  src="/blanco con negro.png" 
                  alt="Conecta Matamoros" 
                  width={50} 
                  height={50}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">CONECTA</h1>
                  <p className="text-xs text-gray-400">MX.</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 max-w-md">
                Agencia de viajes a conciertos desde Matamoros, Tamaulipas. 
                Transporte · Hospedaje · Boletos · Kit Conecta.
              </p>
              <div className="mt-6">
                <a 
                  href="https://wa.me/5218683676890"
                  className="inline-block bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition-all"
                >
                  ¡Reserva ya! →
                </a>
              </div>
            </div>

            {/* Web */}
            <div>
              <h4 className="text-sm font-bold mb-4">Web</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/" className="hover:text-white transition-colors">Eventos</a></li>
                <li><a href="https://wa.me/5218683676890" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Redes */}
            <div>
              <h4 className="text-sm font-bold mb-4">Redes</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://wa.me/5218683676890" className="hover:text-white transition-colors">WhatsApp</a></li>
                <li><a href="https://instagram.com" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://facebook.com" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="https://tiktok.com" className="hover:text-white transition-colors">TikTok</a></li>
              </ul>
            </div>
          </div>

          {/* Contacto */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <p>Conecta Matamoros © 2026 · Todos los derechos reservados</p>
              <p className="text-xs">Operando desde 2013</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Componente Contador
function CountdownTimer({ targetDate }: { targetDate: string }) {
  return (
    <div className="flex gap-4">
      <div className="text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <p className="text-3xl font-bold">00</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">días</p>
      </div>
      <div className="text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <p className="text-3xl font-bold">00</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">hrs</p>
      </div>
      <div className="text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <p className="text-3xl font-bold">00</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">min</p>
      </div>
      <div className="text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <p className="text-3xl font-bold">00</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">seg</p>
      </div>
    </div>
  )
}

// Componente Filtros
function EventFilters() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold whitespace-nowrap">
        Todos
      </button>
      <button className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full text-sm font-bold whitespace-nowrap border border-gray-800">
        Monterrey
      </button>
      <button className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full text-sm font-bold whitespace-nowrap border border-gray-800">
        CDMX
      </button>
      <button className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full text-sm font-bold whitespace-nowrap border border-gray-800">
        Disponibles
      </button>
      <button className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full text-sm font-bold whitespace-nowrap border border-gray-800">
        Últimos
      </button>
    </div>
  )
}

// Componente Tarjeta de Evento
function EventCard({ viaje }: { viaje: any }) {
  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div className="group cursor-pointer bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-red-500 transition-all">
        {/* Imagen */}
        <div className="relative h-64 bg-gray-800 overflow-hidden">
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 via-pink-500 to-blue-500 flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
          {/* Badge */}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-1 rounded-full">
            <p className="text-xs font-bold">
              {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d MMM", { locale: es }).toUpperCase() : 'PRONTO'}
            </p>
          </div>
        </div>
        
        {/* Contenido */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3 text-white group-hover:text-red-500 transition-colors">
            {viaje.nombre}
          </h3>
          
          <div className="space-y-2 mb-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>
                {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{viaje.ciudad || 'Ciudad por confirmar'}</span>
            </div>
            
            {viaje.venue && (
              <div className="flex items-center gap-2 text-xs">
                <span>🏟️</span>
                <span>{viaje.venue}</span>
              </div>
            )}
          </div>
          
          {/* Precio desde */}
          {viaje.precios && (
            <div className="mb-4">
              <p className="text-xs text-gray-500">Desde</p>
              <p className="text-2xl font-bold text-white">
                ${Math.min(...Object.values(viaje.precios).filter(p => p > 0)).toLocaleString()}
              </p>
            </div>
          )}
          
          <button className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-full font-bold hover:from-red-600 hover:to-pink-600 transition-all">
            Ver detalles
          </button>
        </div>
      </div>
    </Link>
  )
}
