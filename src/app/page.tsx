'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Viaje {
  nombre: string
  slug: string
  fecha_evento: string
  ciudad: string
  venue: string
  imagen_portada: string
  descripcion: string
  precios: {
    doble: number
    triple: number
    cuadruple: number
  }
  incluye: string[]
  no_incluye: string[]
  itinerario: Array<{
    dia: string
    actividades: string[]
  }>
  whatsapp_inscripcion: string
}

export default function ViajeDetailPage({ viaje }: { viaje: Viaje }) {
  const [activeTab, setActiveTab] = useState('precios')

  const precioMinimo = Math.min(
    ...[viaje.precios.cuadruple, viaje.precios.triple, viaje.precios.doble].filter(p => p > 0)
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER FIJO */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/blanco con negro.png" 
                alt="Conecta Matamoros" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <div className="text-white font-black text-lg">← VOLVER</div>
              </div>
            </Link>
            
            {viaje.whatsapp_inscripcion && (
              <a 
                href={viaje.whatsapp_inscripcion}
                target="_blank"
                className="px-5 py-2 bg-gradient-to-r from-[#88ea4e] to-[#7dd944] text-black rounded-full font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center gap-2"
              >
                <span>💬</span>
                <span className="hidden sm:inline">RESERVAR</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* SPACER */}
      <div className="h-16"></div>

      {/* HERO CON IMAGEN */}
      <section className="relative h-[70vh] md:h-[80vh]">
        {viaje.imagen_portada ? (
          <Image
            src={viaje.imagen_portada}
            alt={viaje.nombre}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0000cd] to-[#ff283b] flex items-center justify-center">
            <span className="text-9xl">🎵</span>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
        
        {/* Contenido */}
        <div className="absolute bottom-0 left-0 right-0 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              {/* Nombre del evento */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-none">
                {viaje.nombre}
              </h1>
              
              {/* Pills de info */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex items-center gap-2">
                  <span>📅</span>
                  <span className="font-bold text-sm">
                    {viaje.fecha_evento ? format(new Date(viaje.fecha_evento), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha por confirmar'}
                  </span>
                </div>
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex items-center gap-2">
                  <span>📍</span>
                  <span className="font-bold text-sm">{viaje.ciudad}</span>
                </div>
                {viaje.venue && (
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex items-center gap-2">
                    <span>🏟️</span>
                    <span className="font-bold text-sm">{viaje.venue}</span>
                  </div>
                )}
              </div>

              {/* Precio destacado */}
              {precioMinimo > 0 && (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#0000cd] to-[#4169E1] rounded-full">
                  <span className="text-sm font-bold">DESDE</span>
                  <span className="text-3xl font-black">${precioMinimo.toLocaleString()}</span>
                  <span className="text-sm">por persona</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* DESCRIPCIÓN */}
          {viaje.descripcion && (
            <section className="mb-12">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-8">
                <p className="text-lg text-gray-300 leading-relaxed">
                  {viaje.descripcion}
                </p>
              </div>
            </section>
          )}

          {/* TABS */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('precios')}
              className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === 'precios'
                  ? 'bg-gradient-to-r from-[#0000cd] to-[#4169E1] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              💰 PRECIOS
            </button>
            <button
              onClick={() => setActiveTab('incluye')}
              className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === 'incluye'
                  ? 'bg-gradient-to-r from-[#88ea4e] to-[#7dd944] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              ✅ QUÉ INCLUYE
            </button>
            {viaje.itinerario && viaje.itinerario.length > 0 && (
              <button
                onClick={() => setActiveTab('itinerario')}
                className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === 'itinerario'
                    ? 'bg-gradient-to-r from-[#ff283b] to-[#ff4bd1] text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                🗓️ ITINERARIO
              </button>
            )}
          </div>

          {/* PANEL: PRECIOS */}
          {activeTab === 'precios' && (
            <section>
              <h2 className="text-3xl font-black mb-6 text-white">OPCIONES DE HOSPEDAJE</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {viaje.precios.cuadruple > 0 && (
                  <PrecioCard
                    tipo="CUÁDRUPLE"
                    personas="4 personas"
                    camas="2 camas matrimoniales"
                    precio={viaje.precios.cuadruple}
                    color="from-[#0000cd] to-[#4169E1]"
                    emoji="🛏️🛏️"
                  />
                )}
                {viaje.precios.triple > 0 && (
                  <PrecioCard
                    tipo="TRIPLE"
                    personas="3 personas"
                    camas="2 camas"
                    precio={viaje.precios.triple}
                    color="from-[#ff4bd1] to-[#ff283b]"
                    emoji="🛏️🛏️"
                  />
                )}
                {viaje.precios.doble > 0 && (
                  <PrecioCard
                    tipo="DOBLE"
                    personas="2 personas"
                    camas="1 cama matrimonial"
                    precio={viaje.precios.doble}
                    color="from-[#ff283b] to-red-600"
                    emoji="🛏️"
                  />
                )}
              </div>

              {/* Box de reserva */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-[#e8ff4c] rounded-2xl p-8 text-center">
                <div className="text-gray-400 text-sm font-bold mb-2">APARTA TU LUGAR CON</div>
                <div className="text-6xl font-black text-[#e8ff4c] mb-3">$500</div>
                <div className="text-xl font-bold text-white mb-4">por persona</div>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  El resto lo pagas en <span className="text-[#e8ff4c] font-bold">quincenas flexibles</span> hasta antes del evento
                </p>
              </div>
            </section>
          )}

          {/* PANEL: QUÉ INCLUYE */}
          {activeTab === 'incluye' && (
            <section>
              <h2 className="text-3xl font-black mb-6 text-white flex items-center gap-3">
                <span className="text-[#88ea4e]">✅</span> QUÉ INCLUYE
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {viaje.incluye?.map((item: string, i: number) => {
                  const iconos = ['🎫', '🏨', '🚌', '🎁', '✨', '🍔', '📸', '🎉']
                  return (
                    <div key={i} className="flex gap-4 bg-green-900/20 border border-green-800/30 p-5 rounded-xl hover:bg-green-900/30 transition-all">
                      <div className="text-4xl flex-shrink-0">{iconos[i] || '✓'}</div>
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm leading-relaxed">{item}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {viaje.no_incluye && viaje.no_incluye.length > 0 && (
                <>
                  <h3 className="text-2xl font-black mb-4 flex items-center gap-3 mt-8">
                    <span className="text-red-500">❌</span> NO INCLUYE
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viaje.no_incluye.map((item: string, i: number) => (
                      <div key={i} className="flex gap-4 bg-red-900/10 border border-red-800/30 p-5 rounded-xl">
                        <div className="text-2xl flex-shrink-0 text-red-500">✗</div>
                        <div className="text-gray-300 text-sm">{item}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* PANEL: ITINERARIO */}
          {activeTab === 'itinerario' && viaje.itinerario && viaje.itinerario.length > 0 && (
            <section>
              <h2 className="text-3xl font-black mb-6 text-white">ITINERARIO DEL VIAJE</h2>
              <div className="space-y-6">
                {viaje.itinerario.map((dia: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-gray-900 to-gray-800 border-l-4 border-[#ff283b] p-6 rounded-r-2xl hover:border-[#ff4bd1] transition-all">
                    <h3 className="text-2xl font-black text-[#ff283b] mb-4">{dia.dia}</h3>
                    <ul className="space-y-3">
                      {dia.actividades.map((actividad: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-[#ff283b] mt-1 flex-shrink-0 text-lg">▸</span>
                          <span className="text-gray-300 leading-relaxed">{actividad}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA FINAL */}
          {viaje.whatsapp_inscripcion && (
            <section className="mt-16">
              <div className="relative overflow-hidden rounded-3xl p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff283b] via-[#ff4bd1] to-[#0000cd] animate-gradient"></div>
                
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-black mb-4">
                    ¿LISTO PARA ESTA EXPERIENCIA?
                  </h2>
                  <p className="text-xl mb-8 opacity-90">
                    Reserva tu lugar antes de que se agoten los cupos
                  </p>
                  <a 
                    href={viaje.whatsapp_inscripcion}
                    target="_blank"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#ff283b] rounded-full text-xl font-black hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
                  >
                    <span className="text-2xl">💬</span>
                    RESERVAR POR WHATSAPP
                  </a>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-black border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image 
            src="/blanco con negro.png" 
            alt="Conecta Matamoros" 
            width={80} 
            height={80}
            className="mx-auto mb-4 rounded-lg"
          />
          <h3 className="text-2xl font-black mb-2 text-white">CONECTA MATAMOROS</h3>
          <p className="text-gray-400 mb-6">Tu aventura musical comienza aquí</p>
          <Link href="/" className="inline-flex items-center gap-2 text-[#0000cd] hover:text-[#4169E1] transition-colors font-bold text-lg">
            <span>←</span>
            VER TODOS LOS EVENTOS
          </Link>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}

// Componente de tarjeta de precio
function PrecioCard({ tipo, personas, camas, precio, color, emoji }: {
  tipo: string
  personas: string
  camas: string
  precio: number
  color: string
  emoji: string
}) {
  return (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl text-white transform hover:scale-105 transition-all cursor-pointer shadow-xl hover:shadow-2xl`}>
      <div className="text-center">
        <div className="text-5xl mb-4">{emoji}</div>
        <h3 className="text-2xl font-black mb-2">{tipo}</h3>
        <p className="text-sm opacity-90 mb-4">
          {personas}<br/>{camas}
        </p>
        <div className="border-t border-white/20 pt-4">
          <p className="text-4xl font-black">${precio.toLocaleString()}</p>
          <p className="text-sm mt-2 opacity-75">por persona</p>
        </div>
      </div>
    </div>
  )
}
