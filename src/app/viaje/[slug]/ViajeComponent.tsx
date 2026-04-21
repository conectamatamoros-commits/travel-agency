'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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

export default function ViajePage({ viaje }: { viaje: Viaje }) {
  const [activeTab, setActiveTab] = useState('zonas')
  const [activeZona, setActiveZona] = useState(0)

  // Extraer género musical del nombre o usar default
  const genero = viaje.nombre.toLowerCase().includes('morat') ? 'POP LATINO' : 
                 viaje.nombre.toLowerCase().includes('enjambre') ? 'ROCK EN ESPAÑOL' :
                 'CONCIERTO'

  // Color acento basado en el evento (puedes personalizarlo)
  const accentColor = '#ff283b'

  const zonas = [
    {
      nombre: viaje.precios.cuadruple > 0 ? "Cuádruple" : 
              viaje.precios.triple > 0 ? "Triple" : "Doble",
      num: viaje.venue || 'Venue',
      color: accentColor,
      precios: [
        viaje.precios.cuadruple > 0 && {
          tipo: "Cuádruple",
          det: "4 personas · 2 camas matrimoniales",
          monto: `$${viaje.precios.cuadruple.toLocaleString()}`
        },
        viaje.precios.triple > 0 && {
          tipo: "Triple", 
          det: "3 personas · 2 camas matrimoniales",
          monto: `$${viaje.precios.triple.toLocaleString()}`
        },
        viaje.precios.doble > 0 && {
          tipo: "Doble",
          det: "2 personas · 1 cama matrimonial", 
          monto: `$${viaje.precios.doble.toLocaleString()}`
        }
      ].filter(Boolean)
    }
  ]

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap');
        
        body {
          font-family: 'Montserrat', sans-serif;
          background: #000000;
          display: flex;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        
        .card {
          width: 100%;
          max-width: 440px;
          background: #000000;
        }
        
        .hero {
          position: relative;
          height: 320px;
          overflow: hidden;
          border-bottom: 4px solid ${accentColor};
        }
        
        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.9);
        }
        
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%);
        }
        
        .hero-brand {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          z-index: 2;
        }
        
        .hero-logo {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.5px;
          background: ${accentColor};
          padding: 6px 12px;
          border-radius: 4px;
        }
        
        .hero-badge {
          font-size: 10px;
          font-weight: 700;
          color: #000000;
          background: #ffffff;
          padding: 6px 10px;
          border-radius: 12px;
          letter-spacing: 0.3px;
        }
        
        .hero-content {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          z-index: 2;
        }
        
        .hero-title {
          font-size: 48px;
          font-weight: 800;
          color: #ffffff;
          line-height: 0.9;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: -1px;
        }
        
        .hero-info {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .hero-pill {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .main {
          padding: 20px;
        }
        
        .nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #222222;
        }
        
        .nav-tab {
          flex: 1;
          padding: 12px;
          font-size: 13px;
          font-weight: 700;
          color: #666666;
          background: transparent;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        
        .nav-tab.active {
          color: #ffffff;
          border-bottom-color: ${accentColor};
        }
        
        .panel {
          display: none;
        }
        
        .panel.active {
          display: block;
        }
        
        .zona-detail {
          background: #0a0a0a;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #1a1a1a;
        }
        
        .zona-hero {
          position: relative;
          padding: 20px;
          overflow: hidden;
        }
        
        .zona-title {
          position: relative;
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 4px;
        }
        
        .zona-num {
          position: relative;
          font-size: 13px;
          font-weight: 600;
          color: #888888;
          letter-spacing: 0.5px;
        }
        
        .precios-grid {
          padding: 0 20px 20px;
        }
        
        .precio-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #1a1a1a;
        }
        
        .precio-row:last-child {
          border-bottom: none;
        }
        
        .precio-tipo {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }
        
        .precio-det {
          font-size: 11px;
          font-weight: 500;
          color: #666666;
        }
        
        .precio-monto {
          font-size: 22px;
          font-weight: 800;
          color: ${accentColor};
          text-align: right;
        }
        
        .incluye-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .incluye-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: #0a0a0a;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #1a1a1a;
        }
        
        .incluye-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .incluye-text {
          flex: 1;
        }
        
        .incluye-title {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }
        
        .incluye-desc {
          font-size: 12px;
          font-weight: 500;
          color: #888888;
          line-height: 1.4;
        }
        
        .reserva-box {
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 2px solid ${accentColor};
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }
        
        .reserva-label {
          font-size: 11px;
          font-weight: 700;
          color: #888888;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        
        .reserva-monto {
          font-size: 36px;
          font-weight: 800;
          color: ${accentColor};
          margin-bottom: 4px;
        }
        
        .reserva-desc {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 12px;
        }
        
        .reserva-info {
          font-size: 11px;
          font-weight: 500;
          color: #666666;
          line-height: 1.4;
        }
        
        .detalles-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .detalle-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 16px;
        }
        
        .detalle-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .detalle-icon {
          width: 36px;
          height: 36px;
          background: ${accentColor};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .detalle-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }
        
        .detalle-content {
          font-size: 13px;
          font-weight: 500;
          color: #cccccc;
          line-height: 1.6;
        }
        
        .highlight {
          color: ${accentColor};
          font-weight: 700;
        }
        
        .detalle-list {
          list-style: none;
          padding: 0;
        }
        
        .detalle-list li {
          padding: 6px 0;
          padding-left: 20px;
          position: relative;
        }
        
        .detalle-list li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: ${accentColor};
          font-weight: bold;
        }
        
        .footer {
          background: #0a0a0a;
          padding: 24px 20px;
          text-align: center;
          border-top: 1px solid #1a1a1a;
        }
        
        .footer-cta {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }
        
        .footer-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 700;
          color: #000000;
          background: #ffffff;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s;
          margin-bottom: 16px;
        }
        
        .footer-btn:hover {
          background: ${accentColor};
          color: #ffffff;
          transform: scale(1.05);
        }
        
        .footer-contact {
          font-size: 12px;
          font-weight: 600;
          color: #666666;
          margin-top: 12px;
        }
        
        .footer-contact a {
          color: ${accentColor};
          text-decoration: none;
        }
      `}</style>

      <div className="card">
        {/* HERO */}
        <div className="hero">
          <img src={viaje.imagen_portada} alt={viaje.nombre} className="hero-img" />
          <div className="hero-overlay"></div>
          <div className="hero-brand">
            <div className="hero-logo">CONECTA</div>
            <div className="hero-badge">{genero}</div>
          </div>
          <div className="hero-content">
            <div className="hero-title">{viaje.nombre.replace(' 2026', '')}</div>
            <div className="hero-info">
              <div className="hero-pill">📍 {viaje.venue}</div>
              <div className="hero-pill">📅 {new Date(viaje.fecha_evento).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {/* NAV */}
          <div className="nav">
            <button 
              className={`nav-tab ${activeTab === 'zonas' ? 'active' : ''}`}
              onClick={() => setActiveTab('zonas')}
            >
              ZONAS
            </button>
            <button 
              className={`nav-tab ${activeTab === 'incluye' ? 'active' : ''}`}
              onClick={() => setActiveTab('incluye')}
            >
              INCLUYE
            </button>
            <button 
              className={`nav-tab ${activeTab === 'detalles' ? 'active' : ''}`}
              onClick={() => setActiveTab('detalles')}
            >
              DETALLES
            </button>
          </div>

          {/* PANEL: ZONAS */}
          <div className={`panel ${activeTab === 'zonas' ? 'active' : ''}`}>
            <div className="zona-detail">
              <div className="zona-hero">
                <div className="zona-title">{zonas[0].nombre}</div>
                <div className="zona-num">{zonas[0].num}</div>
              </div>
              <div className="precios-grid">
                {zonas[0].precios.map((precio: any, i: number) => (
                  <div key={i} className="precio-row">
                    <div>
                      <div className="precio-tipo">{precio.tipo}</div>
                      <div className="precio-det">{precio.det}</div>
                    </div>
                    <div className="precio-monto">
                      {precio.monto}
                      <span style={{fontSize: '11px', fontWeight: 600, color: '#888', display: 'block', marginTop: '2px'}}>
                        por persona
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PANEL: INCLUYE */}
          <div className={`panel ${activeTab === 'incluye' ? 'active' : ''}`}>
            <div className="incluye-list">
              {viaje.incluye.map((item: string, i: number) => {
                const [titulo, ...descParts] = item.split(' - ')
                const desc = descParts.join(' - ')
                const iconos = ['🎫', '🏨', '🚌', '🎁']
                return (
                  <div key={i} className="incluye-item">
                    <div className="incluye-icon">{iconos[i] || '✓'}</div>
                    <div className="incluye-text">
                      <div className="incluye-title">{titulo}</div>
                      {desc && <div className="incluye-desc">{desc}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="reserva-box" style={{marginTop: '24px'}}>
              <div className="reserva-label">RESERVA CON</div>
              <div className="reserva-monto">$500</div>
              <div className="reserva-desc">por persona</div>
              <div className="reserva-info">Los abonos se realizan de forma flexible hasta completar el pago total</div>
            </div>
          </div>

          {/* PANEL: DETALLES */}
          <div className={`panel ${activeTab === 'detalles' ? 'active' : ''}`}>
            <div className="detalles-grid">
              <div className="detalle-card">
                <div className="detalle-header">
                  <div className="detalle-icon">🎸</div>
                  <div className="detalle-title">Sobre el Evento</div>
                </div>
                <div className="detalle-content">
                  {viaje.descripcion}
                </div>
              </div>

              <div className="detalle-card">
                <div className="detalle-header">
                  <div className="detalle-icon">📍</div>
                  <div className="detalle-title">Ubicación</div>
                </div>
                <div className="detalle-content">
                  <strong className="highlight">{viaje.venue}</strong><br/>
                  {viaje.ciudad}
                </div>
              </div>

              <div className="detalle-card">
                <div className="detalle-header">
                  <div className="detalle-icon">🗓️</div>
                  <div className="detalle-title">Itinerario</div>
                </div>
                <div className="detalle-content">
                  {viaje.itinerario?.map((dia: any, i: number) => (
                    <div key={i} style={{marginBottom: '12px'}}>
                      <strong className="highlight">{dia.dia}</strong>
                      <ul className="detalle-list" style={{marginTop: '8px'}}>
                        {dia.actividades.map((act: string, j: number) => (
                          <li key={j}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detalle-card">
                <div className="detalle-header">
                  <div className="detalle-icon">💳</div>
                  <div className="detalle-title">Forma de Pago</div>
                </div>
                <div className="detalle-content">
                  Reserva tu lugar con <strong className="highlight">$500 pesos</strong> por persona. El resto del pago se puede realizar en abonos flexibles hasta antes del evento. Aceptamos transferencias y efectivo.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-cta">¿Listo para vivir esta experiencia?</div>
          <a href={viaje.whatsapp_inscripcion} className="footer-btn" target="_blank">
            <span>💬</span>
            <span>RESERVAR AHORA</span>
          </a>
          <div className="footer-contact">
            Más información:<br/>
            <a href={viaje.whatsapp_inscripcion} target="_blank">WhatsApp</a>
          </div>
        </div>
      </div>
    </>
  )
}
