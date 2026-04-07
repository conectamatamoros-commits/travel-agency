'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  viajeId: string
  viajeNombre: string
}

export default function EliminarViajeButton({ viajeId, viajeNombre }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function eliminar() {
    setLoading(true)
    try {
      // Get all viajero IDs
      const { data: viajeros } = await supabase.from('viajeros').select('id').eq('viaje_id', viajeId)
      const viajeroIds = viajeros?.map(v => v.id) ?? []

      // Get habitacion IDs
      const { data: habs } = await supabase.from('habitaciones').select('id').eq('viaje_id', viajeId)
      const habIds = habs?.map(h => h.id) ?? []

      // Delete in order
      if (viajeroIds.length > 0) {
        await supabase.from('asignaciones_cuarto').delete().in('viajero_id', viajeroIds)
        await supabase.from('abonos').delete().in('viajero_id', viajeroIds)
        await supabase.from('contactos_emergencia').delete().in('viajero_id', viajeroIds)
        await supabase.from('mensajes_log').delete().in('viajero_id', viajeroIds)
      }
      if (habIds.length > 0) {
        await supabase.from('asignaciones_cuarto').delete().in('habitacion_id', habIds)
        await supabase.from('habitaciones').delete().eq('viaje_id', viajeId)
      }
      await supabase.from('viajeros').delete().eq('viaje_id', viajeId)
      await supabase.from('secciones_boletos').delete().eq('viaje_id', viajeId)
      await supabase.from('lista_espera').delete().eq('viaje_id', viajeId)
      await supabase.from('tareas').delete().eq('viaje_id', viajeId)
      await supabase.from('mensajes_log').delete().eq('viaje_id', viajeId)
      await supabase.from('viajes').delete().eq('id', viajeId)

      router.push('/viajes')
      router.refresh()
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
        <p className="text-xs text-red-700 font-medium">¿Eliminar "{viajeNombre}"?</p>
        <button onClick={eliminar} disabled={loading}
          className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 flex items-center gap-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {loading ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
        <button onClick={() => setConfirm(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
      title="Eliminar viaje">
      <Trash2 className="w-5 h-5" />
    </button>
  )
}


