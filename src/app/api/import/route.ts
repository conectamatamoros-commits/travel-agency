import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { parseExcelFile } from '@/lib/excel-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const parsed = parseExcelFile(buffer, file.name)
    const supabase = createAdminClient()

    // 1. Upsert viaje
    const { data: viaje, error: viajeError } = await supabase
      .from('viajes')
      .upsert({ nombre: parsed.viaje.nombre, nombre_archivo: parsed.viaje.nombre_archivo, activo: true }, { onConflict: 'nombre_archivo' })
      .select('id')
      .single()

    if (viajeError || !viaje) {
      return NextResponse.json({ error: 'Error creando viaje: ' + viajeError?.message }, { status: 500 })
    }

    const viajeId = viaje.id

    // 2. Insert secciones
    if (parsed.secciones.length > 0) {
      await supabase.from('secciones_boletos').delete().eq('viaje_id', viajeId)
      await supabase.from('secciones_boletos').insert(
        parsed.secciones.map(s => ({ ...s, viaje_id: viajeId }))
      )
    }

    // 3. Insert viajeros
    let viajeroCount = 0
    const viajeroIdMap = new Map<string, string>() // nombre -> id

    for (const v of parsed.viajeros) {
      const { data: viajero, error } = await supabase
        .from('viajeros')
        .upsert({
          viaje_id: viajeId,
          nombre: v.nombre,
          fecha_inscripcion: v.fecha_inscripcion ?? null,
          talla: v.talla ?? null,
          celular: v.celular ?? null,
          correo: v.correo ?? null,
          descuento: v.descuento ?? null,
          tipo_habitacion: v.tipo_habitacion ?? null,
          seccion_boleto: v.seccion_boleto ?? null,
          ciudadania: v.ciudadania ?? null,
          fecha_nacimiento: v.fecha_nacimiento ?? null,
          estado: v.estado,
          es_coordinador: v.es_coordinador,
          es_operador: v.es_operador,
          total_pagado: v.total_pagado,
          total_costo: v.total_costo,
          saldo_pendiente: v.saldo_pendiente,
        }, { onConflict: 'viaje_id,nombre' })
        .select('id')
        .single()

      if (!error && viajero) {
        viajeroIdMap.set(v.nombre, viajero.id)
        viajeroCount++

        // Insert abonos
        if (v.abonos.length > 0) {
          await supabase.from('abonos').delete().eq('viajero_id', viajero.id)
          await supabase.from('abonos').insert(
            v.abonos.map((monto, idx) => ({
              viajero_id: viajero.id,
              viaje_id: viajeId,
              monto,
              numero_abono: idx + 1,
            }))
          )
        }

        // Insert contacto
        if (v.contacto?.nombre) {
          await supabase.from('contactos_emergencia').upsert({
            viajero_id: viajero.id,
            nombre: v.contacto.nombre,
            parentesco: v.contacto.parentesco ?? null,
            numero: v.contacto.numero ?? null,
          }, { onConflict: 'viajero_id' })
        }
      }
    }

    // 4. Insert habitaciones
    let habCount = 0
    if (parsed.habitaciones.length > 0) {
      await supabase.from('asignaciones_cuarto').delete().eq('habitacion_id', 
        (await supabase.from('habitaciones').select('id').eq('viaje_id', viajeId)).data?.map(h => h.id) ?? []
      )
      await supabase.from('habitaciones').delete().eq('viaje_id', viajeId)

      for (const h of parsed.habitaciones) {
        const { data: hab } = await supabase.from('habitaciones').insert({
          viaje_id: viajeId,
          numero_cuarto: h.numero_cuarto,
          tipo: h.tipo ?? null,
        }).select('id').single()

        if (hab) {
          habCount++
          // Assign viajeros to room
          for (const nombreViajero of h.viajeros) {
            const viajeroId = viajeroIdMap.get(nombreViajero)
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

    // 5. Insert lista espera
    if (parsed.lista_espera.length > 0) {
      await supabase.from('lista_espera').delete().eq('viaje_id', viajeId)
      await supabase.from('lista_espera').insert(
        parsed.lista_espera.map(e => ({
          viaje_id: viajeId,
          nombre: e.nombre,
          celular: e.celular ?? null,
          personas: e.personas,
        }))
      )
    }

    return NextResponse.json({
      success: true,
      viajeId,
      viajeros: viajeroCount,
      habitaciones: habCount,
      listaEspera: parsed.lista_espera.length,
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
