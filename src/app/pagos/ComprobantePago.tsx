'use client'

import { useRef } from 'react'
import { X, Download, Share2, CheckCircle, Bus } from 'lucide-react'

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

  async function compartirWhatsApp() {
    if (!comprobanteRef.current) return

    try {
      // Use html2canvas via CDN
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      document.head.appendChild(script)
      
      script.onload = async () => {
        const canvas = await (window as unknown as { html2canvas: (el: HTMLElement, opts: object) => Promise<HTMLCanvasElement> }).html2canvas(comprobanteRef.current!, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
        })
        
        canvas.toBlob(async (blob) => {
          if (!blob) return
          const file = new File([blob], `comprobante-${folio}.png`, { type: 'image/png' })
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            // Mobile share (WhatsApp, etc)
            await navigator.share({
              files: [file],
              title: `Comprobante de pago - ${viajero.nombre}`,
            })
          } else {
            // Desktop - download
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `comprobante-${folio}.png`
            a.click()
            URL.revokeObjectURL(url)
          }
        }, 'image/png')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function descargar() {
    if (!comprobanteRef.current) return
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    document.head.appendChild(script)
    script.onload = async () => {
      const canvas = await (window as unknown as { html2canvas: (el: HTMLElement, opts: object) => Promise<HTMLCanvasElement> }).html2canvas(comprobanteRef.current!, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `comprobante-${folio}.png`
      a.click()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        {/* Actions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Comprobante de pago</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comprobante */}
        <div ref={comprobanteRef} className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg leading-none">Conecta Matamoros</p>
                <p className="text-indigo-200 text-xs">Agencia de Viajes</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs">Comprobante de pago</p>
                <p className="font-mono font-bold text-lg">{folio}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-xs">{fecha}</p>
                <p className="text-indigo-200 text-xs">{hora}</p>
              </div>
            </div>
          </div>

          {/* Abono destacado */}
          <div className="bg-green-50 border-b border-green-100 p-5 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Pago registrado</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{formatMXN(abono.monto)}</p>
            <p className="text-xs text-green-500 mt-1">Abono #{abono.numero_abono}</p>
            {abono.notas && <p className="text-xs text-gray-500 mt-1 italic">{abono.notas}</p>}
          </div>

          {/* Datos viajero */}
          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Viajero</p>
              <p className="font-semibold text-gray-900">{viajero.nombre}</p>
              {viajero.celular && <p className="text-sm text-gray-500">{viajero.celular}</p>}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Viaje</p>
              <p className="font-semibold text-gray-900">{viaje.nombre}</p>
              <div className="flex gap-2 mt-1">
                {viajero.tipo_habitacion && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{viajero.tipo_habitacion}</span>
                )}
                {viajero.seccion_boleto && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{viajero.seccion_boleto}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Resumen financiero */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Resumen de pagos</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total del paquete</span>
                  <span className="font-medium text-gray-900">{formatMXN(viajero.total_costo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total pagado</span>
                  <span className="font-medium text-green-600">{formatMXN(viajero.total_pagado)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className={viajero.saldo_pendiente > 0 ? 'text-orange-600' : 'text-green-600'}>
                    {viajero.saldo_pendiente > 0 ? 'Saldo pendiente' : '✓ Liquidado'}
                  </span>
                  <span className={viajero.saldo_pendiente > 0 ? 'text-orange-600' : 'text-green-600'}>
                    {viajero.saldo_pendiente > 0 ? formatMXN(viajero.saldo_pendiente) : '¡Completo!'}
                  </span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progreso de pago</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-5 py-3 text-center">
            <p className="text-xs text-gray-400">Conecta Matamoros · Agencia de Viajes</p>
            <p className="text-xs text-gray-300 mt-0.5">Este comprobante es válido como recibo de pago</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-4">
          <button onClick={descargar}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Descargar
          </button>
          <button onClick={compartirWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-medium py-3 rounded-xl hover:bg-green-600 transition-colors">
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
        </div>
      </div>
    </div>
  )
}
