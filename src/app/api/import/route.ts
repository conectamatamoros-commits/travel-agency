import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { viajeData, userId } = body

    if (!viajeData) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Upsert viaje
    const { data: viaje, error: viajeError } = await supabase
      .from('viajes')
      .upsert(
        { nombre: viajeData.nombre, nombre_archivo: viajeData.nombre_archivo, activo: true },
        { onConflict: 'nombre_archivo' }
      )
      .select('id')
      .single()

    if (viajeError || !viaje) {
      return NextResponse.json({ error: 'Error creando viaje: ' + viajeError?.message }, { status: 500 })
    }

    const viajeId = viaje.id
    let viajeroCount = 0
    const viajeroIdMap: Record<string, string> = {}

    // 2. Insert viajeros
    for (const v of (viajeData.viajeros || [])) {
      const { data: viajero, error } = await supabase
        .from('viajeros')
        .upsert({
          viaje_id: viajeId,
          nombre: v.nombre,
          fecha_inscripcion: v.fecha_inscripcion || null,
          talla: v.talla || null,
          celular: v.celular || null,
          correo: v.correo || null,
          descuento: v.descuento || null,
          tipo_habitacion: v.tipo_habitacion || null,
          seccion_boleto: v.seccion_boleto || null,
          estado: 'activo',
          es_coordinador: false,
          es_operador: false,
          total_pagado: v.total_pagado || 0,
          total_costo: v.total_costo || 0,
          saldo_pendiente: v.saldo_pendiente || 0,
        }, { onConflict: 'viaje_id,nombre' })
        .select('id')
        .single()

      if (!error && viajero) {
        viajeroIdMap[v.nombre] = viajero.id
        viajeroCount++

        if (v.abonos && v.abonos.length > 0) {
          await supabase.from('abonos').delete().eq('viajero_id', viajero.id)
          await supabase.from('abonos').insert(
            v.abonos.map((monto: number, idx: number) => ({
              viajero_id: viajero.id,
              viaje_id: viajeId,
              monto,
              numero_abono: idx + 1,
            }))
          )
        }

        if (v.contacto?.nombre) {
          await supabase.from('contactos_emergencia').upsert({
            viajero_id: viajero.id,
            nombre: v.contacto.nombre,
            parentesco: v.contacto.parentesco || null,
            numero: v.contacto.numero || null,
          }, { onConflict: 'viajero_id' })
        }
      }
    }

    // 3. Insert habitaciones
    let habCount = 0
    if (viajeData.habitaciones && viajeData.habitaciones.length > 0) {
      const { data: existingHabs } = await supabase.from('habitaciones').select('id').eq('viaje_id', viajeId)
      if (existingHabs && existingHabs.length > 0) {
        const habIds = existingHabs.map((h: { id: string }) => h.id)
        await supabase.from('asignaciones_cuarto').delete().in('habitacion_id', habIds)
        await supabase.from('habitaciones').delete().eq('viaje_id', viajeId)
      }

      for (const h of viajeData.habitaciones) {
        const { data: hab } = await supabase.from('habitaciones').insert({
          viaje_id: viajeId,
          numero_cuarto: h.numero_cuarto,
          tipo: h.tipo || null,
        }).select('id').single()

        if (hab) {
          habCount++
          for (const nombreViajero of (h.viajeros || [])) {
            const viajeroId = viajeroIdMap[nombreViajero]
            if (viajeroId) {
              await supabase.from('asignaciones_cuarto').upsert({
                habitacion_id: hab.id,
                viajero_id: viajeroId,
              }, { onConflict: 'habitacion_id,viajero_id' })
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, viajeId, viajeros: viajeroCount, habitaciones: habCount })

  } catch (error) {
    return NextResponse.json({ error: 'Error: ' + String(error) }, { status: 500 })
  }
}
