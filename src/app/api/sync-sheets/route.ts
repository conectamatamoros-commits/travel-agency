// src/app/api/sync-sheets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listExcelFiles, getSpreadsheet } from '@/lib/google-sheets'

const SKIP_SHEETS = new Set(['TABLAS','HOJA1','SHEET1'])
const TIPO_MAP: Record<string,string> = {
  'DOBLE':'Doble','TRIPLE':'Triple','CUADRUPLE':'Cuadruple','INDIVIDUAL':'Individual'
}
const BAD_WORDS = ['TOTAL','DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL','TRANSPORTE',
  'KIT','GASTOS','GNP','CANCHA','VIP','GENERAL','STAY','VIAJERO','NOMBRE',
  'INFO','CONTACTO','ABONO','TABLAS','HABITACI','ROOMLIST','DADO','BAJA']

function looksLikeName(v: unknown): boolean {
  if (!v || typeof v !== 'string') return false
  const s = v.trim()
  if (s.length < 5 || !s.includes(' ')) return false
  if (/\d/.test(s)) return false
  const up = s.toUpperCase()
  return !BAD_WORDS.some(k => up.includes(k))
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, fileName } = await request.json()
    const supabase = createAdminClient()

    const doc = await getSpreadsheet(fileId)
    const nombre = fileName.replace(/\.xlsx?$/i,'').replace(/_/g,' ')

    // Upsert viaje
    const { data: viaje, error: viajeError } = await supabase
      .from('viajes')
      .upsert({ nombre, nombre_archivo: `sheets_${fileId}`, activo: true }, { onConflict: 'nombre_archivo' })
      .select('id').single()

    if (viajeError || !viaje) {
      return NextResponse.json({ error: 'Error creando viaje: ' + viajeError?.message }, { status: 500 })
    }

    const viajeId = viaje.id
    let viajeroCount = 0

    for (const sheet of doc.sheetsByIndex) {
      const upper = sheet.title.toUpperCase().trim()
      if (SKIP_SHEETS.has(upper)) continue
      if (['INFORMACION','INFO','CONTACTO','ROOMLIST','HABITACIONES'].includes(upper)) continue

      const rows = await sheet.getRows()
      
      for (const row of rows) {
        const rowData = row.toObject()
        const values = Object.values(rowData)
        
        // Find name
        let nombre = ''
        let nameIdx = -1
        for (let i = 0; i < Math.min(4, values.length); i++) {
          if (looksLikeName(values[i])) {
            nombre = String(values[i]).trim()
            nameIdx = i
            break
          }
        }
        if (!nombre) continue

        // Get numbers after name
        const nums: number[] = []
        for (let i = nameIdx + 1; i < values.length; i++) {
          const n = parseFloat(String(values[i]).replace(',','.'))
          if (!isNaN(n) && n > 0) nums.push(n)
        }
        if (nums.length === 0) continue

        let total_pagado = 0, total_costo = 0, saldo_pendiente = 0
        const abonos: number[] = []
        if (nums.length >= 3) {
          saldo_pendiente = nums[nums.length - 1]
          total_costo = nums[nums.length - 2]
          total_pagado = nums[nums.length - 3]
          abonos.push(...nums.slice(0, nums.length - 3))
        } else if (nums.length === 2) {
          total_pagado = nums[0]; total_costo = nums[1]
          saldo_pendiente = Math.max(0, total_costo - total_pagado)
        } else {
          total_pagado = nums[0]
        }

        const strs = values.filter(v => typeof v === 'string' && v.trim()).map(v => String(v).trim())
        const tipoRaw = strs.find(s => TIPO_MAP[s.toUpperCase().replace(/Á/g,'A')])
        const tipo_habitacion = tipoRaw ? TIPO_MAP[tipoRaw.toUpperCase().replace(/Á/g,'A')] : null
        const seccion = upper.includes('ABONO') || upper.includes('DATOS') ? null : sheet.title

        const { data: viajeroData } = await supabase
          .from('viajeros')
          .upsert({
            viaje_id: viajeId, nombre, tipo_habitacion,
            seccion_boleto: seccion, estado: 'activo',
            es_coordinador: false, es_operador: false,
            total_pagado, total_costo, saldo_pendiente,
          }, { onConflict: 'viaje_id,nombre' })
          .select('id').single()

        if (viajeroData) {
          viajeroCount++
          if (abonos.length > 0) {
            await supabase.from('abonos').delete().eq('viajero_id', viajeroData.id)
            await supabase.from('abonos').insert(
              abonos.map((monto, idx) => ({
                viajero_id: viajeroData.id, viaje_id: viajeId,
                monto, numero_abono: idx + 1,
              }))
            )
          }
        }
      }
    }

    return NextResponse.json({ success: true, viajeId, viajeros: viajeroCount })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const files = await listExcelFiles()
    return NextResponse.json({ files })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
