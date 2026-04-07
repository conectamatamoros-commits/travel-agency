'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Save, UserPlus } from 'lucide-react'

const TALLAS = ['XS','S','M','L','XL','2XL','XXL']
const TIPOS_HAB = ['Doble','Triple','Cuadruple','Individual']

interface Props {
  viajes: { id: string; nombre: string }[]
  initialViajeId?: string
  onClose: () => void
  onCreated: (viajero: object) => void
}

export default function NuevoViajeroForm({ viajes, initialViajeId, onClose, onCreated }: Props) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', celular: '', correo: '', talla: '', tipo_habitacion: '',
    seccion_boleto: '', descuento: '', total_costo: '',
    viaje_id: initialViajeId ?? (viajes[0]?.id ?? ''),
  })

  async function handleSave() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.viaje_id) { setError('Selecciona un viaje'); return }
    setSaving(true)
    setError('')

    const total_costo = Number(form.total_costo) || 0
    const { data, error: err } = await supabase.from('viajeros').insert({
      viaje_id: form.viaje_id,
      nombre: form.nombre.trim(),
      celular: form.celular || null,
      correo: form.correo || null,
      talla: form.talla || null,
      tipo_habitacion: form.tipo_habitacion || null,
      seccion_boleto: form.seccion_boleto || null,
      descuento: form.descuento || null,
      total_costo,
      total_pagado: 0,
      saldo_pendiente: total_costo,
      estado: 'activo',
      es_coordinador: false,
      es_operador: false,
    }).select('*, viaje:viajes(nombre)').single()

    if (err) { setError('Error al guardar: ' + err.message); setSaving(false); return }
    if (data) { onCreated(data); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Nuevo viajero</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

          <div>
            <label className="label">Viaje *</label>
            <select value={form.viaje_id} onChange={e => setForm(p=>({...p,viaje_id:e.target.value}))} className="input">
              <option value="">Seleccionar viaje...</option>
              {viajes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Nombre completo *</label>
            <input value={form.nombre} onChange={e => setForm(p=>({...p,nombre:e.target.value}))}
              className="input" placeholder="Nombre Apellido Apellido" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Celular / WhatsApp</label>
              <input value={form.celular} onChange={e => setForm(p=>({...p,celular:e.target.value}))}
                className="input" placeholder="868 123 4567" />
            </div>
            <div>
              <label className="label">Correo electrónico</label>
              <input value={form.correo} onChange={e => setForm(p=>({...p,correo:e.target.value}))}
                className="input" placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className="label">Talla</label>
              <select value={form.talla} onChange={e => setForm(p=>({...p,talla:e.target.value}))} className="input">
                <option value="">Sin talla</option>
                {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo de habitación</label>
              <select value={form.tipo_habitacion} onChange={e => setForm(p=>({...p,tipo_habitacion:e.target.value}))} className="input">
                <option value="">Sin asignar</option>
                {TIPOS_HAB.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sección de boleto</label>
              <input value={form.seccion_boleto} onChange={e => setForm(p=>({...p,seccion_boleto:e.target.value}))}
                className="input" placeholder="GNP A, Cancha VIP..." />
            </div>
            <div>
              <label className="label">Total a pagar (MXN)</label>
              <input type="number" value={form.total_costo} onChange={e => setForm(p=>({...p,total_costo:e.target.value}))}
                className="input" placeholder="0.00" />
            </div>
            <div className="col-span-2">
              <label className="label">Descuento (opcional)</label>
              <input value={form.descuento} onChange={e => setForm(p=>({...p,descuento:e.target.value}))}
                className="input" placeholder="Desc. viajero frecuente..." />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Crear viajero'}
          </button>
        </div>
      </div>
    </div>
  )
}
