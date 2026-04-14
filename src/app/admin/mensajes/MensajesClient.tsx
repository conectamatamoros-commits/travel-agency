'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, Mail, Send, Users, Check, Filter, MessageSquare, ChevronDown, ChevronUp, History } from 'lucide-react'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

interface Viajero {
  id: string; nombre: string; celular?: string; correo?: string
  total_pagado: number; saldo_pendiente: number
  tipo_habitacion?: string; seccion_boleto?: string; viaje_id: string
  viaje?: { nombre: string } | null
}

interface Props {
  viajeros: Viajero[]; viajes: { id: string; nombre: string }[]
  mensajesLog: { id: string; tipo: string; destinatario: string; mensaje: string; created_at: string }[]
  currentUserId: string; initialViaje?: string
}

const PLANTILLAS = {
  recordatorio_pago: {
    label: '💰 Recordatorio de pago',
    wa: (v: Viajero) => `Hola ${v.nombre.split(' ')[0]}! 👋 Te contactamos de la agencia para recordarte que tienes un saldo pendiente de *${formatMXN(v.saldo_pendiente)}* para tu viaje a *${(v.viaje as { nombre?: string } | null)?.nombre ?? 'tu evento'}*. 🎶\n\n¿Cuándo podrías realizarlo? Cualquier duda estamos para ayudarte. 🙏`,
    email: (v: Viajero) => `Estimado/a ${v.nombre},\n\nEsperamos que se encuentre muy bien.\n\nLe escribimos para recordarle que tiene un saldo pendiente de ${formatMXN(v.saldo_pendiente)} correspondiente a su viaje ${(v.viaje as { nombre?: string } | null)?.nombre ?? ''}.\n\nPor favor comuníquese con nosotros para coordinar su pago.\n\nMuchas gracias por preferirnos.\n\nAtentamente,\nEquipo de la Agencia`,
  },
  confirmacion: {
    label: '✅ Confirmación de inscripción',
    wa: (v: Viajero) => `¡Hola ${v.nombre.split(' ')[0]}! 🎉 Confirmamos tu inscripción al viaje *${(v.viaje as { nombre?: string } | null)?.nombre ?? 'tu evento'}*.\n\n📍 Habitación: ${v.tipo_habitacion ?? 'Por confirmar'}\n🎟️ Sección: ${v.seccion_boleto ?? 'Por confirmar'}\n\nEn breve te compartiremos más detalles. ¡Vamos a pasarla increíble! 🚌✨`,
    email: (v: Viajero) => `Estimado/a ${v.nombre},\n\nTenemos el gusto de confirmarle su inscripción al viaje ${(v.viaje as { nombre?: string } | null)?.nombre ?? ''}.\n\nDetalles:\n- Habitación: ${v.tipo_habitacion ?? 'Por asignar'}\n- Sección de boleto: ${v.seccion_boleto ?? 'Por asignar'}\n- Monto pagado: ${formatMXN(v.total_pagado)}\n\nSe comunicará próximamente con los detalles del itinerario.\n\nAtentamente,\nEquipo de la Agencia`,
  },
  bienvenida: {
    label: '🎶 Bienvenida al viaje',
    wa: (v: Viajero) => `¡Bienvenido/a ${v.nombre.split(' ')[0]}! 🚌🎉 Ya eres parte de la familia del viaje *${(v.viaje as { nombre?: string } | null)?.nombre ?? 'tu evento'}*.\n\nEsta es tu nueva familia de viaje. Cualquier pregunta o duda, no dudes en escribirnos. ¡Nos vemos pronto! 💃🕺`,
    email: (v: Viajero) => `¡Bienvenido/a ${v.nombre}!\n\nEs un placer tenerle como parte de nuestro viaje ${(v.viaje as { nombre?: string } | null)?.nombre ?? ''}.\n\nEstaremos en comunicación constante para compartirle todos los detalles del viaje.\n\n¡Que tenga un excelente día!\n\nEquipo de la Agencia`,
  },
  saldo_cero: {
    label: '🎊 Pago completado',
    wa: (v: Viajero) => `¡Hola ${v.nombre.split(' ')[0]}! 🎊 Hemos registrado tu pago y ya estás *completamente al corriente*. \n\nViaje: *${(v.viaje as { nombre?: string } | null)?.nombre ?? 'tu evento'}*\nTotal pagado: *${formatMXN(v.total_pagado)}* ✅\n\n¡Gracias por tu puntualidad! 🙌`,
    email: (v: Viajero) => `Estimado/a ${v.nombre},\n\nNos complace informarle que su pago ha sido registrado exitosamente y se encuentra completamente al corriente con su viaje ${(v.viaje as { nombre?: string } | null)?.nombre ?? ''}.\n\nTotal pagado: ${formatMXN(v.total_pagado)}\n\nMuchas gracias por su preferencia.\n\nAtentamente,\nEquipo de la Agencia`,
  },
}

export default function MensajesClient({ viajeros, viajes, mensajesLog: initialLog, currentUserId, initialViaje }: Props) {
  const supabase = createClient()
  const [canal, setCanal] = useState<'whatsapp' | 'email'>('whatsapp')
  const [plantillaKey, setPlantillaKey] = useState<keyof typeof PLANTILLAS>('recordatorio_pago')
  const [viajeFilter, setViajeFilter] = useState(initialViaje ?? '')
  const [soloDeuda, setSoloDeuda] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customMsg, setCustomMsg] = useState('')
  const [log, setLog] = useState(initialLog)
  const [showLog, setShowLog] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = viajeros
    if (viajeFilter) list = list.filter(v => v.viaje_id === viajeFilter)
    if (soloDeuda) list = list.filter(v => (v.saldo_pendiente || 0) > 0)
    if (canal === 'whatsapp') list = list.filter(v => v.celular)
    if (canal === 'email') list = list.filter(v => v.correo)
    return list
  }, [viajeros, viajeFilter, soloDeuda, canal])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(v => v.id)))
    }
  }

  function getMensaje(viajero: Viajero) {
    if (customMsg) return customMsg
    const plantilla = PLANTILLAS[plantillaKey]
    return canal === 'whatsapp' ? plantilla.wa(viajero) : plantilla.email(viajero)
  }

  async function sendOne(viajero: Viajero) {
    const mensaje = getMensaje(viajero)
    setSending(viajero.id)

    if (canal === 'whatsapp' && viajero.celular) {
      const num = viajero.celular.replace(/\D/g, '')
      const mxNum = num.startsWith('52') ? num : `52${num}`
      window.open(`https://wa.me/${mxNum}?text=${encodeURIComponent(mensaje)}`, '_blank')
    } else if (canal === 'email' && viajero.correo) {
      const asunto = PLANTILLAS[plantillaKey].label.replace(/[^\w\s]/g,'').trim()
      window.open(`mailto:${viajero.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`)
    }

    // Log
    await supabase.from('mensajes_log').insert({
      viajero_id: viajero.id, viaje_id: viajero.viaje_id,
      tipo: canal, plantilla: plantillaKey, mensaje,
      destinatario: canal === 'whatsapp' ? (viajero.celular ?? '') : (viajero.correo ?? ''),
      enviado_por: currentUserId,
    })

    setSent(prev => new Set([...prev, viajero.id]))
    setSending(null)
  }

  async function sendSelected() {
    const toSend = filtered.filter(v => selectedIds.has(v.id))
    for (const viajero of toSend) {
      await sendOne(viajero)
      await new Promise(r => setTimeout(r, 300)) // small delay
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Config panel */}
      <div className="space-y-4">
        {/* Canal */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Canal de envío</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'whatsapp' as const, label: 'WhatsApp', icon: Phone, color: 'bg-green-500' },
              { key: 'email' as const, label: 'Correo', icon: Mail, color: 'bg-blue-500' },
            ].map(({ key, label, icon: Icon, color }) => (
              <button key={key} onClick={() => setCanal(key)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${canal === key ? `border-current ${key === 'whatsapp' ? 'border-green-400 bg-green-50 text-green-700' : 'border-blue-400 bg-blue-50 text-blue-700'}` : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Plantilla */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Plantilla</h3>
          <div className="space-y-2">
            {(Object.entries(PLANTILLAS) as [keyof typeof PLANTILLAS, typeof PLANTILLAS[keyof typeof PLANTILLAS]][]).map(([key, p]) => (
              <button key={key} onClick={() => { setPlantillaKey(key); setCustomMsg('') }}
                className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all ${plantillaKey === key && !customMsg ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="label">O mensaje personalizado</label>
            <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)}
              rows={4} className="input resize-none text-sm"
              placeholder="Escribe tu propio mensaje aquí..." />
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Filtrar destinatarios</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Viaje</label>
              <select value={viajeFilter} onChange={e => setViajeFilter(e.target.value)} className="input">
                <option value="">Todos</option>
                {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={soloDeuda} onChange={e => setSoloDeuda(e.target.checked)} className="w-4 h-4 rounded" />
              Solo con saldo pendiente
            </label>
          </div>
        </div>

        {/* Historial */}
        <button onClick={() => setShowLog(f => !f)} className="w-full card p-4 flex items-center justify-between text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            Historial ({log.length})
          </div>
          {showLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showLog && (
          <div className="card divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {log.slice(0,20).map(m => (
              <div key={m.id} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  {m.tipo === 'whatsapp' ? <Phone className="w-3 h-3 text-green-500" /> : <Mail className="w-3 h-3 text-blue-400" />}
                  <span className="text-xs text-gray-500">{m.destinatario}</span>
                  <span className="ml-auto text-xs text-gray-300">{new Date(m.created_at).toLocaleDateString('es-MX')}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{m.mensaje}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contacts list */}
      <div className="col-span-2 space-y-4">
        {/* Actions bar */}
        <div className="card p-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" 
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300" />
            <span className="text-sm text-gray-700">Seleccionar todos ({filtered.length})</span>
          </label>
          {selectedIds.size > 0 && (
            <button onClick={sendSelected}
              className="btn-primary ml-auto">
              <Send className="w-4 h-4" />
              Enviar a {selectedIds.size} seleccionados
            </button>
          )}
          {selectedIds.size === 0 && (
            <p className="text-sm text-gray-400 ml-auto">
              {filtered.length} contactos con {canal === 'whatsapp' ? 'WhatsApp' : 'correo'}
            </p>
          )}
        </div>

        {/* Preview */}
        {filtered.length > 0 && (
          <div className="card p-4 bg-gray-50 border-dashed">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Vista previa del mensaje</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {getMensaje(filtered[0])}
            </p>
          </div>
        )}

        {/* List */}
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(v => {
              const isSent = sent.has(v.id)
              const isSending = sending === v.id
              const isSelected = selectedIds.has(v.id)
              const contacto = canal === 'whatsapp' ? v.celular : v.correo

              return (
                <div key={v.id} onClick={() => toggleSelect(v.id)}
                  className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'} ${isSent ? 'opacity-60' : ''}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-4 h-4 rounded border-gray-300 flex-shrink-0" />
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-700">{v.nombre.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{v.nombre}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      {canal === 'whatsapp' ? <Phone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                      {contacto}
                      {(v.viaje as { nombre?: string } | null)?.nombre && (
                        <span className="ml-1 text-gray-300">· {(v.viaje as { nombre: string }).nombre}</span>
                      )}
                    </p>
                  </div>
                  {(v.saldo_pendiente || 0) > 0 && (
                    <span className="badge-amarillo text-xs">{formatMXN(v.saldo_pendiente)}</span>
                  )}
                  {isSent ? (
                    <span className="badge-verde"><Check className="w-3 h-3" /> Enviado</span>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); sendOne(v) }} disabled={isSending}
                      className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors flex-shrink-0">
                      <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
                    </button>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No hay contactos con {canal === 'whatsapp' ? 'WhatsApp' : 'correo'} disponibles</p>
                {soloDeuda && <p className="text-sm mt-1">Prueba desactivando el filtro de deuda</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
