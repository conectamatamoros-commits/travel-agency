'use client'

import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [viajes, setViajes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    async function cargarViajes() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('viajes')
        .select('*')
        .eq('publico', true)
        .eq('activo', true)
        .order('fecha_evento', { ascending: true })
      
      if (error) {
        console.error('Error al cargar viajes:', error)
      } else {
        setViajes(data || [])
      }
      setLoading(false)
    }
    cargarViajes()
  }, [])

  const hoy = new Date()
  const viajesProximos = viajes.filter(v => new Date(v.fecha_evento) >= hoy)

  // Filtrar viajes según el filtro seleccionado
  const viajesFiltrados = viajesProximos.filter(viaje => {
    if (filtro === 'todos') return true
    if (filtro === 'monterrey') return viaje.ciudad?.toLowerCase().includes('monterrey')
    if (filtro === 'cdmx') return viaje.ciudad?.toLowerCase().includes('cdmx') || viaje.ciudad?.toLowerCase().includes('méxico')
    return true
  })

  const scrollToEvents = (nuevoFiltro: string) => {
    setFiltro(nuevoFiltro)
    const section = document.getElementById('eventos-grid')
    section?.scrollIntoView({ behavior: 'smooth' })
  }

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
                width={50} 
                height={50}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">CONECTA</h1>
                <p className="text-sm text-gray-400 font-medium">MX.</p>
              </div>
            </div>
            <Link 
              href="/admin"
              className="text-sm text-gray-500 hover:text-white transition-colors font-medium"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer para header fijo */}
      <div className="h-20"></div>

      {/* Hero Section con Marquee */}
      <section className="relative overflow-hidden border-b border-gray-800">
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-blue-500 py-4">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-base font-bold mx-8">Conecta Matamoros</span>
            <span className="text-base mx-8">Tours a conciertos</span>
            <span className="text-base mx-8">Desde Matamoros · Tamaulipas</span>
            <span className="text-base font-bold mx-8">Paga en quincenas</span>
            <span className="text-base mx-8">Boletos oficiales</span>
            <span className="text-base font-bold mx-8">Conecta Matamoros</span>
            <span className="text-base mx-8">Tours a conciertos</span>
            <span className="text-base mx-8">Desde Matamoros · Tamaulipas</span>
          </div>
        </div>
      </section>

      {/* Main Hero con Imagen */}
      <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img 
            src="/Header_02.jpg"
            alt="Conecta MX"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Contenido sobre la imagen */}
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <p className="text-base md:text-lg text-white/90 mb-6 font-bold tracking-wide">
              Conecta Matamoros · Catálogo 2026
            </p>
            <h2 className="text-6xl md:text-8xl font-black mb-8 leading-tight text-white drop-shadow-2xl">
              Viaja con expertos
            </h2>
            <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto drop-shadow-lg leading-relaxed font-medium">
              Agencia de viajes a conciertos desde Matamoros, Tamaulipas. 
              Transporte, hospedaje, boletos y kit Conecta — todo resuelto. 
              Escoge tu evento, elige paquete y paga en quincenas sin estrés.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-10">
              <button 
                onClick={() => scrollToEvents('todos')}
                className="bg-white text-black px-10 py-5 rounded-full font-black text-lg hover:bg-gray-200 transition-all transform hover:scale-105"
              >
                Ver eventos →
              </button>
              <a 
                href="https://wa.me/5218683676890"
                className="bg-green-500 text-white px-10 py-5 rounded-full font-black text-lg hover:bg-green-600 transition-all transform hover:scale-105"
              >
                📱 WhatsApp
              </a>
            </div>

            {/* Links rápidos */}
            <div className="flex flex-wrap gap-6 justify-center text-base">
              <a href="https://wa.me/5218683676890" className="text-white/80 hover:text-white transition-colors font-medium">
                ¿Cómo funciona? →
              </a>
              <a href="https://wa.me/5218683676890" className="text-white/80 hover:text-white transition-colors font-medium">
                Preguntas frecuentes →
              </a>
              <a href="https://wa.me/5218683676890" className="text-white/80 hover:text-white transition-colors font-medium">
                Kit Conecta →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros de Eventos */}
      <section className="border-t border-gray-800 py-8 px-4 sticky top-20 bg-black z-40">
        <div className="container mx-auto">
          <h3 className="text-base md:text-lg font-black mb-5 tracking-wide">🔥 LOS MÁS BUSCADOS</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button 
              onClick={() => scrollToEvents('todos')}
              className={`px-6 py-3 rounded-full text-base font-bold whitespace-nowrap ${
                filtro === 'todos' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              Todos
            </button>
            <button 
              onClick={() => scrollToEvents('monterrey')}
              className={`px-6 py-3 rounded-full text-base font-bold whitespace-nowrap ${
                filtro === 'monterrey' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              Monterrey
            </button>
            <button 
              onClick={() => scrollToEvents('cdmx')}
              className={`px-6 py-3 rounded-full text-base font-bold whitespace-nowrap ${
                filtro === 'cdmx' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              CDMX
            </button>
            <button 
              onClick={() => scrollToEvents('todos')}
              className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-full text-base font-bold whitespace-nowrap border border-gray-800"
            >
              Disponibles
            </button>
            <button 
              onClick={() => scrollToEvents('todos')}
              className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-full text-base font-bold whitespace-nowrap border border-gray-800"
            >
              Últimos
            </button>
          </div>
        </div>
      </section>

      {/* Grid de Eventos */}
      <section id="eventos-grid" className="py-16 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-xl">Cargando eventos...</p>
            </div>
          ) : viajesFiltrados.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-xl">No hay eventos disponibles para este filtro</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {viajesFiltrados.map((viaje) => (
                <EventCard key={viaje.id} viaje={viaje} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-16 px-4 mt-24">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <Image 
                  src="/blanco con negro.png" 
                  alt="Conecta Matamoros" 
                  width={60} 
                  height={60}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">CONECTA</h1>
                  <p className="text-sm text-gray-400 font-medium">MX.</p>
                </div>
              </div>
              <p className="text-base text-gray-400 max-w-md leading-relaxed mb-8">
                Agencia de viajes a conciertos desde Matamoros, Tamaulipas. 
                Transporte · Hospedaje · Boletos · Kit Conecta.
              </p>
              <a 
                href="https://wa.me/5218683676890"
                className="inline-block bg-green-500 text-white px-8 py-4 rounded-full font-black text-base hover:bg-green-600 transition-all"
              >
                ¡Reserva ya! →
              </a>
            </div>

            {/* Web */}
            <div>
              <h4 className="text-base font-black mb-5 tracking-wide">Web</h4>
              <ul className="space-y-3 text-base text-gray-400">
                <li><a href="/" className="hover:text-white transition-colors">Eventos</a></li>
                <li><a href="https://wa.me/5218683676890" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Redes */}
            <div>
              <h4 className="text-base font-black mb-5 tracking-wide">Redes</h4>
              <ul className="space-y-3 text-base text-gray-400">
                <li><a href="https://wa.me/5218683676890" className="hover:text-white transition-colors">WhatsApp</a></li>
                <li><a href="https://instagram.com" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://facebook.com" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="https://tiktok.com" className="hover:text-white transition-colors">TikTok</a></li>
              </ul>
            </div>
          </div>

          {/* Contacto */}
          <div className="border-t border-gray-800 pt-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-base text-gray-400">
              <p>Conecta Matamoros © 2026 · Todos los derechos reservados</p>
              <p className="text-sm">Operando desde 2013</p>
            </div>
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
      <div className="group cursor-pointer bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-red-500 transition-all">
        {/* Imagen */}
        <div className="relative h-72 bg-gray-800 overflow-hidden">
          {viaje.imagen_portada ? (
            <Image
              src={viaje.imagen_portada}
              alt={viaje.nombre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 via-pink-500 to-blue-500 flex items-center justify-center">
              <span className="text-7xl">🎵</span>
            </div>
          )}
          {/* Badge */}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-4 py-2 rounded-full">
            <p className="text-sm font-black tracking-wide">
              {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d MMM", { locale: es }).toUpperCase() : 'PRONTO'}
            </p>
          </div>
        </div>
        
        {/* Contenido */}
        <div className="p-7">
          <h3 className="text-2xl font-black mb-4 text-white group-hover:text-red-500 transition-colors leading-tight">
            {viaje.nombre}
          </h3>
          
          <div className="space-y-3 mb-5 text-base text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="font-medium">
                {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="font-medium">{viaje.ciudad || 'Ciudad por confirmar'}</span>
            </div>
            
            {viaje.venue && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🏟️</span>
                <span>{viaje.venue}</span>
              </div>
            )}
          </div>
          
          {/* Precio desde */}
          {viaje.precios && (
            <div className="mb-5">
              <p className="text-sm text-gray-500 font-medium">Desde</p>
              <p className="text-3xl font-black text-white">
                ${Math.min(...Object.values(viaje.precios).filter((p: number) => p > 0)).toLocaleString()}
              </p>
            </div>
          )}
          
          <button className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 rounded-full font-black text-base hover:from-red-600 hover:to-pink-600 transition-all">
            Ver detalles
          </button>
        </div>
      </div>
    </Link>
  )
}
