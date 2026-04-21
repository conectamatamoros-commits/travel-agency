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
    <div className="min-h-screen bg-black text-white font-['Montserrat',sans-serif]">
      {/* HEADER FIJO */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b border-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={50} 
                height={50}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  CONECTA<span className="text-[#ff283b]">.</span>
                </h1>
                <p className="text-xs text-gray-400 font-medium">Matamoros</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://wa.me/528681234567"
                target="_blank"
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#88ea4e] text-black rounded-full font-bold text-sm hover:bg-[#7dd944] transition-all"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
              <Link 
                href="/admin"
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* SPACER */}
      <div className="h-20"></div>

      {/* HERO SECTION */}
      <section className="relative py-32 overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <Image
            src="/blanco con negro.png"
            alt="Background"
            fill
            className="object-cover opacity-5"
            priority
          />
        </div>
        
        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0000cd]/20 via-transparent to-[#ff283b]/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
              VIAJA A TUS
              <br />
              <span className="text-[#ff283b]">CONCIERTOS</span>
              <br />
              FAVORITOS
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 font-medium">
              Transporte · Hospedaje · Boletos · Kit Conecta
              <br />
              <span className="text-[#e8ff4c]">Todo resuelto desde Matamoros</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#eventos"
                className="px-8 py-4 bg-white text-black rounded-full font-black text-lg hover:bg-gray-200 transition-all transform hover:scale-105"
              >
                VER EVENTOS
              </a>
              <a 
                href="https://wa.me/528681234567"
                target="_blank"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-black text-lg hover:bg-white hover:text-black transition-all"
              >
                COTIZAR VIAJE
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* BADGES */}
      <section className="py-12 border-y border-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-2">🎫</div>
              <div className="text-sm font-bold text-white">BOLETOS</div>
              <div className="text-xs text-gray-400">Oficiales</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🚌</div>
              <div className="text-sm font-bold text-white">TRANSPORTE</div>
              <div className="text-xs text-gray-400">De lujo</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🏨</div>
              <div className="text-sm font-bold text-white">HOSPEDAJE</div>
              <div className="text-xs text-gray-400">Incluido</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💳</div>
              <div className="text-sm font-bold text-white">PAGOS</div>
              <div className="text-xs text-gray-400">Flexibles</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRÓXIMOS EVENTOS */}
      {viajesProximos.length > 0 && (
        <section id="eventos" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-4xl md:text-5xl font-black mb-4">
                🔥 PRÓXIMOS <span className="text-[#ff283b]">EVENTOS</span>
              </h3>
              <p className="text-gray-400 text-lg">
                Escoge tu evento favorito y aparta tu lugar
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {viajesProximos.map((viaje) => (
                <EventCard key={viaje.id} viaje={viaje} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CÓMO FUNCIONA */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-black mb-4">
              ¿CÓMO <span className="text-[#0000cd]">FUNCIONA</span>?
            </h3>
            <p className="text-gray-400 text-lg">
              En 4 pasos sencillos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <StepCard 
              number="1"
              title="ELIGE TU EVENTO"
              description="Selecciona el concierto o festival al que quieres ir"
              color="bg-[#ff283b]"
            />
            <StepCard 
              number="2"
              title="COTIZA TU PAQUETE"
              description="Elige tu habitación y tipo de boleto"
              color="bg-[#0000cd]"
            />
            <StepCard 
              number="3"
              title="APARTA CON $500"
              description="Reserva tu lugar y paga en quincenas"
              color="bg-[#ff4bd1]"
            />
            <StepCard 
              number="4"
              title="¡LISTO PARA VIAJAR!"
              description="Nosotros nos encargamos de todo"
              color="bg-[#88ea4e]"
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff283b] to-[#ff4bd1]"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h3 className="text-4xl md:text-5xl font-black mb-6">
            ¿LISTO PARA LA AVENTURA?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            ¡Aparta tu lugar ahora! Los cupos son limitados
          </p>
          <a 
            href="https://wa.me/528681234567"
            target="_blank"
            className="inline-block px-10 py-5 bg-white text-[#ff283b] rounded-full text-xl font-black hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            📱 COTIZAR POR WHATSAPP
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div>
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={60} 
                height={60}
                className="mb-4 rounded-lg"
              />
              <p className="text-gray-400 text-sm">
                Agencia de viajes a conciertos desde Matamoros, Tamaulipas
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">EVENTOS</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#eventos" className="hover:text-white">Próximos viajes</a></li>
                <li><a href="#" className="hover:text-white">Cómo funciona</a></li>
                <li><a href="#" className="hover:text-white">Preguntas frecuentes</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">CONTACTO</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="https://wa.me/528681234567" className="hover:text-white">WhatsApp</a></li>
                <li><a href="https://instagram.com" className="hover:text-white">Instagram</a></li>
                <li><a href="https://facebook.com" className="hover:text-white">Facebook</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-900 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© 2026 Conecta Matamoros · Todos los derechos reservados · Operando desde 2013</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Componente Tarjeta de Evento
function EventCard({ viaje }: { viaje: any }) {
  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div className="group cursor-pointer rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-[#ff283b] transition-all transform hover:scale-[1.02]">
        {/* Imagen */}
        <div className="relative h-64 bg-gray-800 overflow-hidden">
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0000cd] to-[#ff283b] flex items-center justify-center">
              <span className="text-8xl">🎵</span>
            </div>
          )}
          
          {/* Badge de precio */}
          {viaje.precios?.doble && (
            <div className="absolute top-4 right-4 bg-[#ff283b] text-white px-3 py-1.5 rounded-full text-sm font-bold">
              Desde ${viaje.precios.cuadruple || viaje.precios.triple || viaje.precios.doble}
            </div>
          )}
        </div>
        
        {/* Contenido */}
        <div className="p-6">
          <h3 className="text-2xl font-black mb-3 text-white group-hover:text-[#ff283b] transition-colors">
            {viaje.nombre}
          </h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <span>📅</span>
              <span className="text-sm font-medium">
                {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-400">
              <span>📍</span>
              <span className="text-sm">{viaje.ciudad || 'Ciudad'}</span>
            </div>
            
            {viaje.venue && (
              <div className="flex items-center gap-2 text-gray-400">
                <span>🏟️</span>
                <span className="text-sm">{viaje.venue}</span>
              </div>
            )}
          </div>
          
          <button className="w-full py-3 bg-gradient-to-r from-[#ff283b] to-[#ff4bd1] text-white rounded-xl font-bold hover:from-[#ff4bd1] hover:to-[#ff283b] transition-all">
            VER DETALLES
          </button>
        </div>
      </div>
    </Link>
  )
}

// Componente Step Card
function StepCard({ number, title, description, color }: { number: string, title: string, description: string, color: string }) {
  return (
    <div className="text-center">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-black text-white ${color}`}>
        {number}
      </div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}
