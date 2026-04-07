'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Save, Bus } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function NuevoViajeForm({ onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', fecha_evento: '', ciudad: '', venue: '',
  })

  async function handleSave() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('viajes').insert({
      nombre: form.nombre.trim(),
      nombre_archivo: `manual_${Date.now()}.xlsx`,
      fecha_evento: form.fecha_evento || null,
      ciudad: form.ciudad || null,
      venue: form.venue || null,
      activo: true,
    }).select('id').single()

    if (err) { setError('Error: ' + err.message); setSaving(false); return }
    if (data) { onClose(); router.push(`/viajes/${data.id}`); router.refresh() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
              <Bus className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Nuevo viaje</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
          <div>
            <label className="label">Nombre del viaje / evento *</label>
            <input value={form.nombre} onChange={e => setForm(p=>({...p,nombre:e.target.value}))}
              className="input" placeholder="Ej: Bad Bunny 2026, Nortex Monterrey..." autoFocus />
          </div>
          <div>
            <label className="label">Fecha del evento</label>
            <input type="date" value={form.fecha_evento} onChange={e => setForm(p=>({...p,fecha_evento:e.target.value}))} className="input" />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input value={form.ciudad} onChange={e => setForm(p=>({...p,ciudad:e.target.value}))}
              className="input" placeholder="Monterrey, CDMX..." />
          </div>
          <div>
            <label className="label">Venue / Lugar</label>
            <input value={form.venue} onChange={e => setForm(p=>({...p,venue:e.target.value}))}
              className="input" placeholder="Estadio BBVA, Foro Sol..." />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" />
            {saving ? 'Creando...' : 'Crear viaje'}
          </button>
        </div>
      </div>
    </div>
  )
}
