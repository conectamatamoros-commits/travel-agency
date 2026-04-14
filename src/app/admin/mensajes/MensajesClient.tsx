'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Viajero {
  id: string
  nombre: string
  celular: string
  correo: string
  viaje_id: string
  total_pagado?: number
  saldo_pendiente?: number
  tipo_habitacion?: string
  seccion_boleto?: string
  viaje?: Array<{
    nombre: string
  }>
}

interface Viaje {
  id: string
  nombre: string
}

interface MensajesClientProps {
  viajeros: Viajero[]
  viajes: Viaje[]
  mensajesLog: any[]
  currentUserId: string
  initialViaje?: string
}

export default function MensajesClient({ 
  viajeros: initialViajeros, 
  viajes: allViajes,
  initialViaje 
}: MensajesClientProps) {
  const supabase = createClient()
  const [viajeros] = useState(initialViajeros)
  const [selectedViaje, setSelectedViaje] = useState<string>(initialViaje || 'all')
  const [messageType, setMessageType] = useState<'whatsapp' | 'email'>('whatsapp')
  const [template, setTemplate] = useState<string>('recordatorio')
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  const templates = {
    recordatorio: '¡Hola {nombre}! 👋 Te recordamos que tu viaje a {viaje} está próximo. ¿Ya completaste tu pago? 💰',
    confirmacion: 'Hola {nombre}, confirmamos tu inscripción al viaje {viaje}. ¡Nos vemos pronto! ✈️',
    documentos: '{nombre}, recuerda traer tu identificación oficial para el viaje a {viaje}. 📄',
    custom: customMessage
  }

  const filteredViajeros = selectedViaje === 'all' 
    ? viajeros 
    : viajeros.filter(v => {
        const viajeNombre = v.viaje?.[0]?.nombre
        return viajeNombre === selectedViaje
      })

  const getMessage = (viajero: Viajero) => {
    const message = templates[template as keyof typeof templates] || customMessage
    const viajeNombre = viajero.viaje?.[0]?.nombre || 'tu viaje'
    return message
      .replace('{nombre}', viajero.nombre)
      .replace('{viaje}', viajeNombre)
  }

  const sendWhatsApp = async (viajero: Viajero) => {
    if (!viajero.celular) return

    setSending(viajero.id)
    const message = getMessage(viajero)
    const whatsappUrl = `https://wa.me/${viajero.celular.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')

    await supabase.from('mensajes_log').insert({
      viajero_id: viajero.id,
      viaje_id: viajero.viaje_id,
      tipo: 'whatsapp',
      contenido: message
    })

    const prevArray = Array.from(sent)
    setSent(new Set([...prevArray, viajero.id]))
    setSending(null)
  }

  const sendEmail = async (viajero: Viajero) => {
    if (!viajero.correo) return

    setSending(viajero.id)
    const message = getMessage(viajero)
    const viajeNombre = viajero.viaje?.[0]?.nombre || 'Conecta Matamoros'
    const subject = `Información sobre tu viaje - ${viajeNombre}`
    const mailtoUrl = `mailto:${viajero.correo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    
    window.open(mailtoUrl, '_blank')

    await supabase.from('mensajes_log').insert({
      viajero_id: viajero.id,
      viaje_id: viajero.viaje_id,
      tipo: 'email',
      contenido: message
    })

    const prevArray = Array.from(sent)
    setSent(new Set([...prevArray, viajero.id]))
    setSending(null)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Enviar Mensajes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Viaje</label>
            <select
              value={selectedViaje}
              onChange={(e) => setSelectedViaje(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">Todos los viajes</option>
              {allViajes.map(viaje => (
                <option key={viaje.id} value={viaje.nombre}>{viaje.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as 'whatsapp' | 'email')}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Plantilla</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="recordatorio">Recordatorio de Pago</option>
              <option value="confirmacion">Confirmación</option>
              <option value="documentos">Documentos</option>
              <option value="custom">Mensaje Personalizado</option>
            </select>
          </div>
        </div>

        {template === 'custom' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Mensaje Personalizado</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Usa {nombre} y {viaje} para personalizar"
            />
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm font-medium mb-2">Vista previa:</p>
          <p className="text-sm text-gray-700">
            {getMessage(filteredViajeros[0] || { 
              nombre: 'Juan', 
              viaje: [{ nombre: 'Ejemplo' }] 
            } as Viajero)}
          </p>
        </div>
      </div>

      {/* Lista de viajeros */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viajero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredViajeros.map(viajero => (
                <tr key={viajero.id} className={sent.has(viajero.id) ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{viajero.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{viajero.viaje?.[0]?.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {messageType === 'whatsapp' ? viajero.celular : viajero.correo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {messageType === 'whatsapp' ? (
                      <button
                        onClick={() => sendWhatsApp(viajero)}
                        disabled={sending === viajero.id || sent.has(viajero.id) || !viajero.celular}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {sending === viajero.id ? 'Enviando...' : sent.has(viajero.id) ? 'Enviado ✓' : 'Enviar WhatsApp'}
                      </button>
                    ) : (
                      <button
                        onClick={() => sendEmail(viajero)}
                        disabled={sending === viajero.id || sent.has(viajero.id) || !viajero.correo}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {sending === viajero.id ? 'Enviando...' : sent.has(viajero.id) ? 'Enviado ✓' : 'Enviar Email'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
