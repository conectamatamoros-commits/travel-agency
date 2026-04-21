import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: viajes } = await supabase
    .from('viajes')
    .select('*')
    .eq('publico', true)
    .eq('activo', true)
    .order('fecha_evento', { ascending: true })

  const hoy = new Date()
  const viajesProximos = viajes?.filter(v => new Date(v.fecha_evento) >= hoy) || []

  return (
    <div className="min-h-screen bg-black">
      {/* HEADER SUPERIOR STICKY */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={45} 
                height={45}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <div className="text-white font-black text-xl tracking-tight">CONECTA</div>
                <div className="text-[#ff283b] text-xs font-bold">MATAMOROS</div>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#eventos" className="text-gray-300 hover:text-white transition-colors">EVENTOS</a>
              <a href="#como-funciona" className="text-gray-300 hover:text-white transition-colors">CÓMO FUNCIONA</a>
              <a 
                href="https://wa.me/528681234567"
                target="_blank"
                className="px-5 py-2 bg-gradient-to-r from-[#88ea4e] to-[#7dd944] text-black rounded-full font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all"
              >
                💬 WhatsApp
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* HERO MODERNO */}
      <section className="relative pt-24 pb-32 overflow-hidden min-h-[80vh] flex items-center">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <Image
            src="/Header_02.jpg"
            alt="Conecta MX"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay oscuro para legibilidad */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#88ea4e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#88ea4e]"></span>
              </span>
              <span className="text-white text-sm font-medium">Tours oficiales desde Matamoros</span>
            </div>

            {/* Título principal */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-none">
              VIAJA A TUS
              <br />
              <span className="bg-gradient-to-r from-[#ff283b] via-[#ff4bd1] to-[#0000cd] bg-clip-text text-transparent">
                CONCIERTOS
              </span>
              <br />
              FAVORITOS
            </h1>

            {/* Subtítulo */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Transporte · Hospedaje · Boletos · Kit Conecta
            </p>
            <p className="text-lg text-[#e8ff4c] mb-12 font-semibold">
              Todo incluido · Paga en quincenas
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="#eventos"
                className="group px-8 py-4 bg-white text-black rounded-full font-black text-lg hover:bg-gray-100 transition-all flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto justify-center"
              >
                VER EVENTOS
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a 
                href="https://wa.me/528681234567"
                target="_blank"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-black text-lg hover:bg-white hover:text-black transition-all w-full sm:w-auto justify-center flex items-center gap-2"
              >
                <span>💬</span>
                COTIZAR VIAJE
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* BADGES DE BENEFICIOS */}
      <section className="py-16 bg-gradient-to-r from-[#0000cd] to-[#4169E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: '🎫', title: 'BOLETOS OFICIALES', desc: 'Garantizados' },
              { icon: '🚌', title: 'TRANSPORTE', desc: 'Redondo de lujo' },
              { icon: '🏨', title: 'HOSPEDAJE', desc: 'Hoteles 4 estrellas' },
              { icon: '💳', title: 'PAGOS FLEXIBLES', desc: 'En quincenas' }
            ].map((item, i) => (
              <div key={i} className="text-center group cursor-pointer">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform drop-shadow-lg">{item.icon}</div>
                <div className="text-white font-black text-sm mb-1 drop-shadow-md">{item.title}</div>
                <div className="text-white/80 text-xs font-medium">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTOS */}
      {viajesProximos.length > 0 && (
        <section id="eventos" className="py-20 relative overflow-hidden">
          {/* Imagen de fondo para la sección */}
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/Header_03.jpg"
              alt="Background"
              fill
              className="object-cover"
            />
            {/* Overlay oscuro para contraste */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header de sección */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                CATÁLOGO <span className="text-[#0000cd]">2026</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Escoge tu evento y aparta con $500
              </p>
            </div>

            {/* Grid de eventos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viajesProximos.map((viaje) => (
                <EventCard key={viaje.id} viaje={viaje} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              ¿CÓMO <span className="text-[#0000cd]">FUNCIONA</span>?
            </h2>
            <p className="text-gray-400 text-lg">4 pasos para vivir tu concierto</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'ELIGE', desc: 'Escoge tu evento favorito del catálogo', color: 'from-[#ff283b] to-[#ff4bd1]' },
              { num: '2', title: 'COTIZA', desc: 'Selecciona tu paquete y tipo de habitación', color: 'from-[#0000cd] to-[#4169E1]' },
              { num: '3', title: 'APARTA', desc: 'Reserva con $500 y paga en quincenas', color: 'from-[#ff4bd1] to-[#ff283b]' },
              { num: '4', title: 'VIAJA', desc: '¡Nosotros nos encargamos de todo!', color: 'from-[#88ea4e] to-[#7dd944]' }
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" 
                     style={{ background: `linear-gradient(to bottom right, ${step.color})` }}></div>
                <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-black mb-4`}>
                    {step.num}
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff283b] via-[#ff4bd1] to-[#0000cd]"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            ¿LISTO PARA LA AVENTURA?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Más de 10,000 viajeros nos han elegido
          </p>
          <a 
            href="https://wa.me/528681234567"
            target="_blank"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#ff283b] rounded-full text-xl font-black hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
          >
            <span className="text-2xl">💬</span>
            COTIZAR POR WHATSAPP
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image 
                  src="/blanco con negro.png" 
                  alt="Conecta" 
                  width={50} 
                  height={50}
                  className="rounded-lg"
                />
                <div>
                  <div className="text-white font-black text-xl">CONECTA</div>
                  <div className="text-gray-500 text-xs">Matamoros</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Agencia de viajes especializada en conciertos y festivales desde Matamoros, Tamaulipas. 13 años conectando fans con la música.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm">NAVEGACIÓN</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#eventos" className="text-gray-400 hover:text-white transition-colors">Eventos</a></li>
                <li><a href="#como-funciona" className="text-gray-400 hover:text-white transition-colors">Cómo funciona</a></li>
                <li><a href="/admin" className="text-gray-400 hover:text-white transition-colors">Admin</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm">CONTACTO</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://wa.me/528681234567" className="text-gray-400 hover:text-white transition-colors">WhatsApp</a></li>
                <li><a href="https://instagram.com" className="text-gray-400 hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://facebook.com" className="text-gray-400 hover:text-white transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 Conecta Matamoros · Todos los derechos reservados · Operando desde 2013
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Componente de tarjeta de evento mejorado
function EventCard({ viaje }: { viaje: any }) {
  const precioMinimo = Math.min(
    ...[viaje.precios?.cuadruple, viaje.precios?.triple, viaje.precios?.doble].filter(p => p > 0)
  )

  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div className="group relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-[#0000cd] transition-all hover:scale-[1.02]">
        {/* Imagen */}
        <div className="relative h-72 overflow-hidden">
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0000cd] to-[#ff283b] flex items-center justify-center">
              <span className="text-8xl">🎵</span>
            </div>
          )}
          
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
          
          {/* Badge de precio flotante */}
          {precioMinimo > 0 && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-[#0000cd] backdrop-blur-sm rounded-full">
              <div className="text-white text-xs font-bold">DESDE</div>
              <div className="text-white text-lg font-black">${precioMinimo.toLocaleString()}</div>
            </div>
          )}

          {/* Contenido sobre imagen */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-2xl font-black text-white mb-2 group-hover:text-[#e8ff4c] transition-colors">
              {viaje.nombre}
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                📅 {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d MMM", { locale: es }) : 'Próximamente'}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                📍 {viaje.ciudad}
              </span>
            </div>
          </div>
        </div>

        {/* Footer de la card */}
        <div className="p-6 bg-gradient-to-br from-gray-900 to-black">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-medium">
              {viaje.venue || 'Venue por confirmar'}
            </span>
            <span className="text-[#0000cd] font-bold text-sm group-hover:translate-x-1 transition-transform">
              Ver detalles →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
