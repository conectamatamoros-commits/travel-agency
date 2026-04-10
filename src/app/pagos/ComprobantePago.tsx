'use client'

import { useRef } from 'react'
import { X, Download, Share2 } from 'lucide-react'

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
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap');`}</style>

          {/* Header azul con nombre agencia */}
          <div style={{ background: 'linear-gradient(135deg, #0000cd, #0033ff)', padding: '24px 20px' }}>
            {/* Nombre agencia centrado y grande */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ color: '#ffffff', fontSize: '26px', fontWeight: '900', letterSpacing: '2px', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
                CONECTA
              </div>
              <div style={{ color: '#e8ff4c', fontSize: '14px', fontWeight: '700', letterSpacing: '6px', fontFamily: 'Montserrat, sans-serif', marginTop: '2px' }}>
                MATAMOROS
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '2px', marginTop: '4px', fontFamily: 'Montserrat, sans-serif' }}>
                AGENCIA DE VIAJES
              </div>
            </div>

            {/* Folio y fecha */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '2px', fontFamily: 'Montserrat, sans-serif' }}>FOLIO</div>
                <div style={{ color: '#e8ff4c', fontSize: '13px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>{folio}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', fontFamily: 'Montserrat, sans-serif' }}>{fecha}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', fontFamily: 'Montserrat, sans-serif' }}>{hora}</div>
              </div>
            </div>
          </div>

          {/* Monto del abono */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #222', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', borderRadius: '50px', padding: '6px 16px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', background: '#88ea4e', borderRadius: '50%' }}></div>
              <span style={{ color: '#88ea4e', fontSize: '11px', fontWeight: '600', letterSpacing: '2px', fontFamily: 'Montserrat, sans-serif' }}>PAGO REGISTRADO</span>
            </div>
            <div style={{ color: '#ffffff', fontSize: '42px', fontWeight: '900', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
              {formatMXN(abono.monto)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '6px', fontFamily: 'Montserrat, sans-serif' }}>
              Abono #{abono.numero_abono}
            </div>
            {abono.notas && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px', fontStyle: 'italic', fontFamily: 'Montserrat, sans-serif' }}>
                {abono.notas}
              </div>
            )}
          </div>

          {/* Info viajero */}
          <div style={{ padding: '20px', borderBottom: '1px solid #222' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '2px', marginBottom: '6px', fontFamily: 'Montserrat, sans-serif' }}>VIAJERO</div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>{viajero.nombre}</div>
            {viajero.celular && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px', fontFamily: 'Montserrat, sans-serif' }}>{viajero.celular}</div>}
            <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'Montserrat, sans-serif' }}>VIAJE</div>
            <div style={{ color: '#ff4bd1', fontSize: '14px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>{viaje.nombre}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {viajero.tipo_habitacion && (
                <span style={{ background: '#111', border: '1px solid #333', color: 'rgba(255,255,255,0.5)', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontFamily: 'Montserrat, sans-serif' }}>
                  {viajero.tipo_habitacion}
                </span>
              )}
              {viajero.seccion_boleto && (
                <span style={{ background: '#111', border: '1px solid #333', color: 'rgba(255,255,255,0.5)', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontFamily: 'Montserrat, sans-serif' }}>
                  {viajero.seccion_boleto}
                </span>
              )}
            </div>
          </div>

          {/* Resumen financiero - EN NEGRITAS */}
          <div style={{ padding: '20px', borderBottom: '1px solid #222' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'Montserrat, sans-serif' }}>RESUMEN DE PAGOS</div>
            
            {/* Total del paquete */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '10px 12px', background: '#111', borderRadius: '10px' }}>
              <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>TOTAL DEL PAQUETE</span>
              <span style={{ color: '#ffffff', fontSize: '15px', fontWeight: '900', fontFamily: 'Montserrat, sans-serif' }}>{formatMXN(viajero.total_costo)}</span>
            </div>

            {/* Total pagado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '10px 12px', background: '#0a1f0a', border: '1px solid #1a4d1a', borderRadius: '10px' }}>
              <span style={{ color: '#88ea4e', fontSize: '13px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>TOTAL PAGADO</span>
              <span style={{ color: '#88ea4e', fontSize: '15px', fontWeight: '900', fontFamily: 'Montserrat, sans-serif' }}>{formatMXN(viajero.total_pagado)}</span>
            </div>

            {/* Saldo pendiente */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 12px', background: viajero.saldo_pendiente > 0 ? '#1f0a0a' : '#0a1f0a', border: `1px solid ${viajero.saldo_pendiente > 0 ? '#4d1a1a' : '#1a4d1a'}`, borderRadius: '10px' }}>
              <span style={{ color: viajero.saldo_pendiente > 0 ? '#ff283b' : '#88ea4e', fontSize: '13px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>
                {viajero.saldo_pendiente > 0 ? 'SALDO PENDIENTE' : '✓ LIQUIDADO'}
              </span>
              <span style={{ color: viajero.saldo_pendiente > 0 ? '#ff283b' : '#88ea4e', fontSize: '15px', fontWeight: '900', fontFamily: 'Montserrat, sans-serif' }}>
                {viajero.saldo_pendiente > 0 ? formatMXN(viajero.saldo_pendiente) : '¡COMPLETO!'}
              </span>
            </div>

            {/* Barra progreso */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}>Progreso de pago</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>{pct}%</span>
            </div>
            <div style={{ height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#88ea4e' : 'linear-gradient(90deg, #0000cd, #ff4bd1)', borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontFamily: 'Montserrat, sans-serif' }}>
              Este comprobante es válido como recibo
            </div>
            <div style={{ color: '#e8ff4c', fontSize: '9px', fontWeight: '700', letterSpacing: '1px', fontFamily: 'Montserrat, sans-serif' }}>
              CM ®
            </div>
          </div>
        </div>

        {/* Botones acción */}
        <div className="flex gap-3 mt-4">
          <button onClick={() => capturarYCompartir(true)}
            className="flex-1 flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>
            <Download className="w-4 h-4" /> Descargar
          </button>
          <button onClick={() => capturarYCompartir(false)}
            className="flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: '#88ea4e', color: '#000000' }}>
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
