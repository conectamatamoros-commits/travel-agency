'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Phone, Mail, BedDouble, CreditCard, User, Calendar, Shirt, Tag, 
  AlertCircle, MessageSquare, CheckCircle, PhoneCall, Edit2, Save, X, Trash2 } from 'lucide-react'
import Link from 'next/link'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

const TALLAS = ['XS','S','M','L','XL','2XL','XXL']
const TIPOS_HAB = ['Doble','Triple','Cuadruple','Individual']

interface Props {
  viajero: {
    id: string; nombre: string; celular?: string; correo?: string
    talla?: string; descuento?: string; tipo_habitacion?: string
    seccion_boleto?: string; ciudadania?: string; fecha_inscripcion?: string
    total_pagado: number; total_costo: number; saldo_pendiente: number
    viaje_id: string; viaje?: { id: string; nombre: string } | null
  }
  abonos: { id: string; monto: number; numero_abono?: number; notas?: string }[]
  contacto?: { id?: string; nombre?: string; parentesco?: string; numero?: string } | null
  asignacion?: { habitacion: { numero_cuarto: string; tipo?: string } } | null
}

export default function ViajeroDetalle({ viajero: initial, abonos, contacto, asignacion }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [viajero, setViajero] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    nombre: initial.nombre,
    celular: initial.celular ?? '',
    correo: initial.correo ?? '',
    talla: initial.talla ?? '',
    tipo_habitacion: initial.tipo_habitacion ?? '',
    seccion_boleto: initial.seccion_boleto ?? '',
    descuento: initial.descuento ?? '',
    ciudadania: initial.ciudadania ?? '',
    total_costo: String(initial.total_costo),
  })

  function showMsg(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  async function saveChanges() {
    setSaving(true)
    const total_costo = Number(form.total_costo) || viajero.total_costo
    const saldo_pendiente = Math.max(0, total_costo - viajero.total_pagado)

    const { error } = await supabase.from('viajeros').update({
      nombre: form.nombre,
      celular: form.celular || null,
      correo: form.correo || null,
      talla: form.talla || null,
      tipo_habitacion: form.tipo_habitacion || null,
      seccion_boleto: form.seccion_boleto || null,
      descuento: form.descuento || null,
      ciudadania: form.ciudadania || null,
      total_costo,
      saldo_pendiente,
    }).eq('id', viajero.id)

    if (!error) {
      setViajero(v => ({ ...v, ...form, total_costo, saldo_pendiente }))
      setEditing(false)
      showMsg('✅ Datos actualizados')
      router.refresh()
    }
    setSaving(false)
  }

  async function deleteViajero() {
    if (!confirm(`¿Eliminar a ${viajero.nombre}? Esta acción no se puede deshacer.`)) return
    await supabase.from('asignaciones_cuarto').delete().eq('viajero_id', viajero.id)
    await supabase.from('abonos').delete().eq('viajero_id', viajero.id)
    await supabase.from('contactos_emergencia').delete().eq('viajero_id', viajero.id)
    await supabase.from('viajeros').delete().eq('id', viajero.id)
    router.push('/viajeros')
  }

  const pct = viajero.total_costo > 0 ? Math.min(Math.round((viajero.total_pagado / viajero.total_costo) * 100), 100) : 100

  function getWALink(cel: string) {
    const num = cel.replace(/\D/g,'')
    return `https://wa.me/${num.startsWith('52') ? num : '52'+num}`
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-5">
        {/* Header card */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-700">{viajero.nombre.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{viajero.nombre}</h1>
                {viajero.viaje?.nombre && (
                  <Link href={`/viajes/${viajero.viaje.id}`} className="text-sm text-brand-600 hover:underline">
                    🚌 {viajero.viaje.nombre}
                  </Link>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {viajero.tipo_habitacion && <span className="badge-azul">{viajero.tipo_habitacion}</span>}
                  {viajero.seccion_boleto && <span className="badge-gris">{viajero.seccion_boleto}</span>}
                  {viajero.talla && <span className="badge-gris">Talla: {viajero.talla}</span>}
                  {viajero.descuento && <span className="badge-amarillo">{viajero.descuento}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing && (
                <>
                  <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={deleteViajero} className="btn-secondary text-red-500 border-red-200 hover:bg-red-50 text-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}

          {editing ? (
            /* Edit form */
            <div className="border-t border-gray-100 pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre completo</label>
                  <input value={form.nombre} onChange={e => setForm(p=>({...p,nombre:e.target.value}))} className="input" />
                </div>
                <div>
                  <label className="label">Celular / WhatsApp</label>
                  <input value={form.celular} onChange={e => setForm(p=>({...p,celular:e.target.value}))} className="input" placeholder="868 123 4567" />
                </div>
                <div>
                  <label className="label">Correo electrónico</label>
                  <input value={form.correo} onChange={e => setForm(p=>({...p,correo:e.target.value}))} className="input" placeholder="correo@ejemplo.com" />
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
                  <input value={form.seccion_boleto} onChange={e => setForm(p=>({...p,seccion_boleto:e.target.value}))} className="input" placeholder="GNP A, Cancha B..." />
                </div>
                <div>
                  <label className="label">Descuento</label>
                  <input value={form.descuento} onChange={e => setForm(p=>({...p,descuento:e.target.value}))} className="input" placeholder="Desc. viajero frecuente..." />
                </div>
                <div>
                  <label className="label">Total a pagar (MXN)</label>
                  <input type="number" value={form.total_costo} onChange={e => setForm(p=>({...p,total_costo:e.target.value}))} className="input" />
                </div>
                <div>
                  <label className="label">Ciudadanía</label>
                  <input value={form.ciudadania} onChange={e => setForm(p=>({...p,ciudadania:e.target.value}))} className="input" placeholder="Mex, USA..." />
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setEditing(false)} className="btn-secondary">
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button onClick={saveChanges} disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              {[
                { icon: Phone, label: 'Celular', value: viajero.celular },
                { icon: Mail, label: 'Correo', value: viajero.correo },
                { icon: Calendar, label: 'Inscripción', value: viajero.fecha_inscripcion ? new Date(viajero.fecha_inscripcion).toLocaleDateString('es-MX', {day:'numeric',month:'long',year:'numeric'}) : null },
                { icon: Shirt, label: 'Talla', value: viajero.talla },
                { icon: Tag, label: 'Descuento', value: viajero.descuento },
                { icon: User, label: 'Ciudadanía', value: viajero.ciudadania },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label}>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Icon className="w-3 h-3" /> {label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ) : null)}
            </div>
          )}
        </div>

        {/* Pagos */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" /> Pagos y Abonos
            </h2>
            <Link href="/pagos" className="text-sm text-brand-600">Gestionar →</Link>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Progreso</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full ${pct>=100?'bg-green-500':pct>50?'bg-brand-500':'bg-orange-400'}`} style={{width:`${pct}%`}} />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Total costo', value: formatMXN(viajero.total_costo), color: 'text-gray-700' },
              { label: 'Pagado', value: formatMXN(viajero.total_pagado), color: 'text-green-600' },
              { label: 'Pendiente', value: formatMXN(viajero.saldo_pendiente), color: viajero.saldo_pendiente > 0 ? 'text-orange-500' : 'text-gray-300' },
            ].map(({label,value,color}) => (
              <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {abonos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {abonos.map((a,i) => (
                <div key={a.id} className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400">Abono {i+1}</p>
                  <p className="text-sm font-semibold text-green-700">{formatMXN(a.monto)}</p>
                  {a.notas && <p className="text-xs text-gray-400">{a.notas}</p>}
                </div>
              ))}
            </div>
          )}
          {viajero.saldo_pendiente <= 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm font-medium text-green-700">¡Pago completado!</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Acciones contacto */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Contactar viajero</h3>
          <div className="space-y-2">
            {viajero.celular && (
              <a href={getWALink(viajero.celular)} target="_blank"
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors">
                <Phone className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">WhatsApp</p>
                  <p className="text-xs text-green-600">{viajero.celular}</p>
                </div>
              </a>
            )}
            {viajero.correo && (
              <a href={`mailto:${viajero.correo}`}
                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors">
                <Mail className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Correo</p>
                  <p className="text-xs text-blue-600 truncate">{viajero.correo}</p>
                </div>
              </a>
            )}
            {!viajero.celular && !viajero.correo && (
              <p className="text-sm text-gray-400 text-center py-2">Sin datos de contacto</p>
            )}
          </div>
        </div>

        {/* Cuarto */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-gray-400" /> Habitación
          </h3>
          {asignacion ? (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="font-semibold text-blue-800">{asignacion.habitacion.numero_cuarto}</p>
              <p className="text-sm text-blue-600">{asignacion.habitacion.tipo ?? 'Sin tipo'}</p>
            </div>
          ) : (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <p className="text-sm text-orange-700">Sin cuarto asignado</p>
            </div>
          )}
          <Link href="/cuartos" className="btn-secondary w-full justify-center mt-3 text-sm py-2">
            Gestionar cuartos
          </Link>
        </div>

        {/* Contacto emergencia */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-gray-400" /> Contacto de emergencia
          </h3>
          {contacto?.nombre ? (
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400">Nombre</p>
                <p className="text-sm font-medium text-gray-800">{contacto.nombre}</p>
              </div>
              {contacto.parentesco && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400">Parentesco</p>
                  <p className="text-sm font-medium text-gray-800">{contacto.parentesco}</p>
                </div>
              )}
              {contacto.numero && (
                <a href={getWALink(contacto.numero)} target="_blank"
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100">
                  <Phone className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-400">Número</p>
                    <p className="text-sm font-medium text-green-700">{contacto.numero}</p>
                  </div>
                </a>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin contacto registrado</p>
              <p className="text-xs text-gray-300 mt-1">Se importa desde el Excel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
