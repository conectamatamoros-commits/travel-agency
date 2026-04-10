'use client'

import { useRef } from 'react'
import { X, Download, Share2, CheckCircle } from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  viajero: {
    nombre: string
    celular?: string
    tipo_habitacion?: string
    seccion_boleto?: string
    total_pagado: number
    total_costo: number
    saldo_pendiente: number
  }
  viaje: { nombre: string }
  abono: { monto: number; numero_abono: number; notas?: string }
  onClose: () => void
}

export default function ComprobantePago({ viajero, viaje, abono, onClose }: Props) {
  const comprobanteRef = useRef<HTMLDivElement>(null)
  const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const folio = `CM-${Date.now().toString().slice(-6)}`
  const pct = Math.min(Math.round((viajero.total_pagado / viajero.total_costo) * 100), 100)

  async function capturarYCompartir(descargar = false) {
    if (!comprobanteRef.current) return
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    document.head.appendChild(script)
    script.onload = async () => {
      const canvas = await (window as unknown as { html2canvas: (el: HTMLElement, opts: object) => Promise<HTMLCanvasElement> })
        .html2canvas(comprobanteRef.current!, { scale: 2, backgroundColor: '#000000', useCORS: true })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        if (descargar) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `comprobante-${folio}.png`; a.click()
          URL.revokeObjectURL(url)
        } else {
          const file = new File([blob], `comprobante-${folio}.png`, { type: 'image/png' })
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `Comprobante ${viajero.nombre}` })
          } else {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `comprobante-${folio}.png`; a.click()
            URL.revokeObjectURL(url)
          }
        }
      }, 'image/png')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Comprobante de pago</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* COMPROBANTE */}
        <div ref={comprobanteRef} style={{
          background: '#000000',
          fontFamily: "'Montserrat', sans-serif",
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #333',
        }}>
          {/* Importar Montserrat */}
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap');`}</style>

          {/* Header con gradiente azul */}
          <div style={{ background: 'linear-gradient(135deg, #0000cd, #0033ff)', padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '900', letterSpacing: '1px', fontFamily: 'Montserrat, sans-serif' }}>
                  CONECTA
                </div>
                <div style={{ color: '#e8ff4c', fontSize: '11px', fontWeight: '500', letterSpacing: '3px', fontFamily: 'Montserrat, sans-serif' }}>
                  MATAMOROS
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}>FOLIO</div>
                <div style={{ color: '#e8ff4c', fontSize: '14px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>{folio}</div>
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}>
              {fecha} · {hora}
            </div>
          </div>

          {/* Monto principal */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #222', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', borderRadius: '50px', padding: '6px 16px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', background: '#88ea4e', borderRadius: '50%' }}></div>
              <span style={{ color: '#88ea4e', fontSize: '11px', fontWeight: '600', letterSpacing: '2px', fontFamily: 'Montserrat, sans-serif' }}>PAGO REGISTRADO</span>
            </div>
            <div style={{ color: '#ffffff', fontSize: '40px', fontWeight: '900', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
              {formatMXN(abono.monto)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '6px', fontFamily: 'Montserrat, sans-serif' }}>
              Abono #{abono.numero_abono}
            </div>
            {abono.notas && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px', fontStyle: 'italic', fontFamily: 'Montserrat, sans-serif' }}>
                {abono.notas}
              </div>
            )}
          </div>

          {/* Info viajero */}
          <div style={{ padding: '20px', borderBottom: '1px solid #222' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'Montserrat, sans-serif' }}>VIAJERO</div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>{viajero.nombre}</div>
            {viajero.celular && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px', fontFamily: 'Montserrat, sans-serif' }}>{viajero.celular}</div>}
            <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'Montserrat, sans-serif' }}>VIAJE</div>
            <div style={{ color: '#ff4bd1', fontSize: '14px', fontWeight: '600', fontFamily: 'Montserrat, sans-serif' }}>{viaje.nombre}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {viajero.tipo_habitacion && (
                <span style={{ background: '#111', border: '1px solid #333', color: 'rgba(255,255,255,0.6)', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontFamily: 'Montserrat, sans-serif' }}>
                  {viajero.tipo_habitacion}
                </span>
              )}
              {viajero.seccion_boleto && (
                <span style={{ background: '#111', border: '1px solid #333', color: 'rgba(255,255,255,0.6)', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontFamily: 'Montserrat, sans-serif' }}>
                  {viajero.seccion_boleto}
                </span>
              )}
            </div>
          </div>

          {/* Resumen financiero */}
          <div style={{ padding: '20px', borderBottom: '1px solid #222' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '2px', marginBottom: '12px', fontFamily: 'Montserrat, sans-serif' }}>RESUMEN DE PAGOS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'Montserrat, sans-serif' }}>Total del paquete</span>
              <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '600', fontFamily: 'Montserrat, sans-serif' }}>{formatMXN(viajero.total_costo)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'Montserrat, sans-serif' }}>Total pagado</span>
              <span style={{ color: '#88ea4e', fontSize: '12px', fontWeight: '600', fontFamily: 'Montserrat, sans-serif' }}>{formatMXN(viajero.total_pagado)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'Montserrat, sans-serif' }}>
                {viajero.saldo_pendiente > 0 ? 'Saldo pendiente' : '✓ Liquidado'}
              </span>
              <span style={{ color: viajero.saldo_pendiente > 0 ? '#ff283b' : '#88ea4e', fontSize: '12px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>
                {viajero.saldo_pendiente > 0 ? formatMXN(viajero.saldo_pendiente) : '¡Completo!'}
              </span>
            </div>

            {/* Barra de progreso */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}>Progreso</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}>{pct}%</span>
            </div>
            <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#88ea4e' : 'linear-gradient(90deg, #0000cd, #ff4bd1)', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}>
              Agencia de Viajes
            </div>
            <div style={{ color: '#e8ff4c', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', fontFamily: 'Montserrat, sans-serif' }}>
              CONECTA MATAMOROS
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-4">
          <button onClick={() => capturarYCompartir(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white font-medium py-3 rounded-xl hover:bg-white/20 transition-colors">
            <Download className="w-4 h-4" /> Descargar
          </button>
          <button onClick={() => capturarYCompartir(false)}
            style={{ background: '#88ea4e' }}
            className="flex-1 flex items-center justify-center gap-2 text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
