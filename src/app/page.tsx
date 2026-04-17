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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-pink-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Conecta Matamoros</h1>
                <p className="text-xs text-pink-400">Agencia de Viajes</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#eventos" className="text-white hover:text-pink-400 transition-colors">EVENTOS</a>
              <a href="#galeria" className="text-white hover:text-pink-400 transition-colors">GALERÍA</a>
              <a href="#contacto" className="text-white hover:text-pink-400 transition-colors">CONTACTO</a>
              <Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">
                Admin
              </Link>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" className="text-white hover:text-pink-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" className="text-white hover:text-pink-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://wa.me/5218683676890" target="_blank" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-all">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[500px] mt-16 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80)',
              filter: 'brightness(0.4)'
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,205,0.3) 0%, rgba(255,75,209,0.3) 50%, rgba(232,255,76,0.2) 100%)'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              Vive la Experiencia
            </h1>
            <p className="text-2xl md:text-3xl text-pink-300 mb-8">
              Los Mejores Conciertos de 2025-2026
            </p>
            <div className="flex gap-4 justify-center">
              <a 
                href="#eventos"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Ver Eventos
              </a>
              <a 
                href="https://wa.me/5218683676890"
                target="_blank"
                className="bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition-all transform hover:scale-105"
              >
                📱 Reservar Ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Talented Members / Artistas Section */}
      <section id="eventos" className="py-20 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
              PRÓXIMOS <span className="text-pink-500">EVENTOS</span>
            </h2>
            <p className="text-gray-400">Los mejores artistas en vivo</p>
          </div>

          {/* Grid de Artistas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {viajesProximos.map((viaje) => (
              <ArtistCard key={viaje.id} viaje={viaje} />
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {viajesPasados.length > 0 && (
        <section id="galeria" className="py-20 bg-[#0a0a0a]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-2">
                EVENTOS <span className="text-pink-500">REALIZADOS</span>
              </h2>
              <p className="text-gray-400">Revive los mejores momentos</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {viajesPasados.map((viaje) => (
                <GalleryCard key={viaje.id} viaje={viaje} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subscribe Section */}
      <section className="py-20 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Suscríbete
            </h2>
            <p className="text-gray-400 mb-8">
              Recibe notificaciones de nuevos eventos cada mes
            </p>
            
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold hover:from-pink-600 hover:to-purple-700 transition-all">
                Suscribir
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-black/40 border-t border-pink-500/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-pink-500 font-bold mb-4">CONTACTO</h3>
              <div className="space-y-2 text-gray-400">
                <p>📍 Matamoros, Tamaulipas</p>
                <p>📞 +52 868 367 6890</p>
                <p>📧 info@conectamatamoros.com</p>
                <p>🌐 www.conectamatamoros.com</p>
              </div>
            </div>

            {/* Recent Posts */}
            <div>
              <h3 className="text-pink-500 font-bold mb-4">PRÓXIMOS EVENTOS</h3>
              <div className="space-y-2">
                {viajesProximos.slice(0, 3).map((viaje) => (
                  <Link 
                    key={viaje.id}
                    href={`/viaje/${viaje.slug}`}
                    className="block text-gray-400 hover:text-pink-400 transition-colors text-sm"
                  >
                    {viaje.nombre} - {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d MMM yyyy", { locale: es }) : 'TBA'}
                  </Link>
                ))}
              </div>
            </div>

            {/* Download Apps */}
            <div>
              <h3 className="text-pink-500 font-bold mb-4">SÍGUENOS</h3>
              <div className="flex gap-4 mb-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-white/10">
            <p className="text-gray-500 text-sm">
              © Copyright 2026 <span className="text-pink-500">Conecta Matamoros</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Artist Card Component
function ArtistCard({ viaje }: { viaje: any }) {
  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div className="group relative overflow-hidden rounded-lg cursor-pointer">
        {/* Image */}
        <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600">
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Social Icons on Hover */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-bold text-sm mb-1">{viaje.nombre}</h3>
          <p className="text-xs text-pink-400">
            {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d MMM yyyy", { locale: es }) : 'Fecha por confirmar'}
          </p>
        </div>
      </div>
    </Link>
  )
}

// Gallery Card Component
function GalleryCard({ viaje }: { viaje: any }) {
  return (
    <Link href={`/viaje/${viaje.slug}`}>
      <div className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group">
        {viaje.imagen_portada ? (
          <Image
            src={viaje.imagen_portada}
            alt={viaje.nombre}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-sm font-bold text-center px-2">{viaje.nombre}</span>
        </div>

        {/* Badge "Finalizado" */}
        <div className="absolute top-2 right-2 bg-gray-800/90 text-white px-2 py-1 rounded text-xs">
          Finalizado
        </div>
      </div>
    </Link>
  )
}
