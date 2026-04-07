import * as XLSX from 'xlsx'

export interface ParsedExcelData {
  viaje: { nombre: string; nombre_archivo: string }
  secciones: { nombre: string; costo_transporte?: number; costo_kit?: number; costo_gastos?: number }[]
  viajeros: {
    nombre: string; fecha_inscripcion?: string; talla?: string; celular?: string
    correo?: string; descuento?: string; tipo_habitacion?: string; seccion_boleto?: string
    estado: string; es_coordinador: boolean; es_operador: boolean
    total_pagado: number; total_costo: number; saldo_pendiente: number; abonos: number[]
    contacto?: { nombre?: string; parentesco?: string; numero?: string }
  }[]
  habitaciones: { numero_cuarto: string; tipo?: string; viajeros: string[] }[]
  lista_espera: { nombre: string; celular?: string; personas: number }[]
}

const SKIP_WORDS = ['VIAJERO','NOMBRE','INFORMACI','CELULAR','TALLA','CUARTO',
  'TOTAL','DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL','TRANSPORTE','KIT','GASTOS',
  'GNP','BACHATA','DIAMANTE','BEYOND','PLATINO','VIP','GENERAL','STAY',
  'DATOS','INFO','CONTACTO','COLUMN','PARENTESCO','NUMERO','CORREO','DESCUENTO',
  'FECHA','NAN','UNDEFINED','NULL','VUELOS','TRASLADOS','BOLETOS',
  'COORDINADOR','OPERADOR','BAJA','NUEVOS','COSTOS','RESERVACION',
  'SHEET','HOJA','TABLAS','ABONO','ROOMLIST','HABITACION','CANCHA']

function isName(val: unknown): boolean {
  if (val === null || val === undefined) return false
  const s = String(val).trim()
  if (s.length < 4) return false
  if (/^\d+([.,]\d+)?$/.test(s)) return false
  if (s.includes('@')) return false
  // Must have at least 2 words (first and last name)
  const words = s.split(/\s+/).filter(w => w.length > 0)
  if (words.length < 2) return false
  // Must start with a letter
  if (!/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ]/.test(s)) return false
  const upper = s.toUpperCase()
  return !SKIP_WORDS.some(k => upper.includes(k))
}

function toNum(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined
  const n = typeof val === 'number' ? val : Number(String(val).replace(',','.'))
  return isNaN(n) || n <= 0 ? undefined : n
}

function toDate(val: unknown): string | undefined {
  if (!val) return undefined
  try {
    if (val instanceof Date) return val.toISOString().split('T')[0]
    if (typeof val === 'number' && val > 40000) {
      const d = new Date((val - 25569) * 86400000)
      return d.toISOString().split('T')[0]
    }
    const s = String(val)
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0,10)
  } catch {}
  return undefined
}

function parseAbonosSheet(ws: XLSX.WorkSheet, seccionName?: string): ParsedExcelData['viajeros'] {
  const result: ParsedExcelData['viajeros'] = []
  const TIPOS: Record<string,string> = {
    'DOBLE':'Doble','TRIPLE':'Triple','CUADRUPLE':'Cuadruple',
    'CUÁDRUPLE':'Cuadruple','INDIVIDUAL':'Individual'
  }
  const TALLAS = new Set(['XS','S','M','L','XL','2XL','XXL'])

  // Use sheet_to_json with header:1 to get raw arrays
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  for (const rawRow of rows) {
    if (!Array.isArray(rawRow)) continue
    const row = rawRow as unknown[]

    // Find name in first 4 columns
    let nombre = ''
    let nameIdx = -1
    for (let i = 0; i < Math.min(4, row.length); i++) {
      if (isName(row[i])) { nombre = String(row[i]).trim(); nameIdx = i; break }
    }
    if (!nombre || nameIdx < 0) continue

    // Get all numbers after name (skip nulls)
    const nums: number[] = []
    for (let i = nameIdx + 1; i < row.length; i++) {
      const n = toNum(row[i])
      if (n !== undefined) nums.push(n)
    }

    // Last 3 nums = total_pagado, total_costo, saldo_pendiente
    let total_pagado = 0, total_costo = 0, saldo_pendiente = 0, abonos: number[] = []
    if (nums.length >= 3) {
      saldo_pendiente = nums[nums.length - 1]
      total_costo = nums[nums.length - 2]
      total_pagado = nums[nums.length - 3]
      abonos = nums.slice(0, nums.length - 3).filter(n => n > 0)
    } else if (nums.length === 2) {
      total_pagado = nums[0]; total_costo = nums[1]
      saldo_pendiente = Math.max(0, total_costo - total_pagado)
    } else if (nums.length === 1) {
      total_pagado = nums[0]
    }

    // Get text values after name
    const texts: string[] = []
    for (let i = nameIdx + 1; i < row.length; i++) {
      const v = row[i]
      if (v === null || v === undefined) continue
      const s = String(v).trim()
      if (!s || s === 'null' || s === 'NaN') continue
      if (typeof v === 'number') continue
      texts.push(s)
    }

    const tipoRaw = texts.find(t => TIPOS[t.toUpperCase().replace('Á','A')])
    const tipo_habitacion = tipoRaw ? TIPOS[tipoRaw.toUpperCase().replace('Á','A')] : undefined
    const talla = texts.find(t => TALLAS.has(t.toUpperCase()))
    const celular = texts.find(t => /^[\d\s\(\)\-\.]{7,}$/.test(t) && t.replace(/\D/g,'').length >= 7)
    const seccion = seccionName ?? texts.find(t =>
      !TIPOS[t.toUpperCase().replace('Á','A')] &&
      !TALLAS.has(t.toUpperCase()) &&
      !/^[\d\s\(\)\-\.]{7,}$/.test(t) &&
      t.length > 1 && t !== 'L' && t !== 'M' && t !== 'null'
    )

    result.push({
      nombre, talla, celular, tipo_habitacion, seccion_boleto: seccion,
      estado: 'activo', es_coordinador: false, es_operador: false,
      total_pagado, total_costo, saldo_pendiente, abonos,
    })
  }
  return result
}

function parseInfoSheet(ws: XLSX.WorkSheet): Map<string, Partial<ParsedExcelData['viajeros'][0]>> {
  const map = new Map<string, Partial<ParsedExcelData['viajeros'][0]>>()
  const TALLAS = new Set(['XS','S','M','L','XL','2XL','XXL','-'])
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  for (const rawRow of rows) {
    if (!Array.isArray(rawRow)) continue
    const row = rawRow as unknown[]
    let nombre = '', fecha: string|undefined, talla: string|undefined
    let celular: string|undefined, correo: string|undefined, descuento: string|undefined

    for (const cell of row) {
      if (cell === null || cell === undefined) continue
      const s = String(cell).trim()
      if (!s || s === 'null' || s === 'NaN') continue
      // Date detection
      if (s.match(/^\d{4}-\d{2}-\d{2}/) || (typeof cell === 'number' && cell > 40000 && cell < 55000)) {
        fecha = toDate(cell) ?? fecha; continue
      }
      if (s.includes('@') && !correo) { correo = s; continue }
      if (TALLAS.has(s.toUpperCase()) && !talla) { talla = s; continue }
      if ((s.toLowerCase().includes('desc') || s.toLowerCase().includes('frec')) && !descuento) { descuento = s; continue }
      if (/^[\d\s\(\)\-\.]{7,}$/.test(s) && s.replace(/\D/g,'').length >= 7 && !celular) { celular = s; continue }
      if (isName(cell) && !nombre) { nombre = s; continue }
    }
    if (nombre) map.set(nombre, { fecha_inscripcion: fecha, talla, celular, correo, descuento })
  }
  return map
}

function parseContactoSheet(ws: XLSX.WorkSheet): Map<string, ParsedExcelData['viajeros'][0]['contacto']> {
  const map = new Map<string, ParsedExcelData['viajeros'][0]['contacto']>()
  const PARENTESCOS = new Set(['PAREJA','ESPOSO','ESPOSA','MADRE','PADRE','HERMANO','HERMANA',
    'HIJO','HIJA','AMIGO','AMIGA','ABUELO','ABUELA','ABUELITA','NOVIO','NOVIA','PRIMO','PRIMA'])
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  for (const rawRow of rows) {
    if (!Array.isArray(rawRow)) continue
    const texts = (rawRow as unknown[])
      .map(v => String(v ?? '').trim())
      .filter(v => v && v !== 'null' && v !== 'NaN')
    if (texts.some(t => ['VIAJERO','NOMBRE','PARENTESCO','NUMERO'].includes(t.toUpperCase()))) continue
    const names = texts.filter(t => isName(t))
    if (!names[0]) continue
    const parentesco = texts.find(t => PARENTESCOS.has(t.toUpperCase()))
    const numero = texts.find(t => t.replace(/\D/g,'').length >= 7)
    map.set(names[0], { nombre: names[1], parentesco, numero })
  }
  return map
}

function parseRoomlistSheet(ws: XLSX.WorkSheet): ParsedExcelData['habitaciones'] {
  const habs: ParsedExcelData['habitaciones'] = []
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  let headerRow = -1

  for (let i = 0; i < rows.length; i++) {
    if ((rows[i] as unknown[]).some(v => /cuarto\s*\d*/i.test(String(v ?? '')))) {
      headerRow = i; break
    }
  }
  if (headerRow < 0) return habs

  const headers = rows[headerRow] as unknown[]
  const cols: { idx: number; nombre: string }[] = []
  headers.forEach((v, i) => {
    const s = String(v ?? '').trim()
    if (/cuarto\s*\d*/i.test(s)) cols.push({ idx: i, nombre: s })
  })

  const TIPOS = new Set(['DOBLE','TRIPLE','CUADRUPLE','CUÁDRUPLE','INDIVIDUAL'])
  const cuartos = new Map(cols.map(c => [c.idx, { nombre: c.nombre, tipo: undefined as string|undefined, viajeros: [] as string[] }]))

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    for (const c of cols) {
      const v = String(row[c.idx] ?? '').trim()
      if (!v || v === 'null') continue
      const d = cuartos.get(c.idx)!
      if (TIPOS.has(v.toUpperCase().replace('Á','A'))) d.tipo = v
      else if (isName(v)) d.viajeros.push(v)
    }
  }

  cuartos.forEach(d => {
    if (d.viajeros.length > 0 || d.tipo)
      habs.push({ numero_cuarto: d.nombre, tipo: d.tipo, viajeros: d.viajeros })
  })
  return habs
}

export function parseExcelFile(buffer: ArrayBuffer, filename: string): ParsedExcelData {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
  const nombre = filename.replace(/\.xlsx?$/i,'').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())

  const result: ParsedExcelData = {
    viaje: { nombre, nombre_archivo: filename },
    secciones: [{ nombre: 'General', costo_transporte: 780, costo_kit: 170, costo_gastos: 900 }],
    viajeros: [], habitaciones: [], lista_espera: [],
  }

  const allViajeros: ParsedExcelData['viajeros'] = []
  let infoMap = new Map<string, Partial<ParsedExcelData['viajeros'][0]>>()
  let contactoMap = new Map<string, ParsedExcelData['viajeros'][0]['contacto']>()

  const SKIP_SHEETS = new Set(['TABLAS','HOJA1','SHEET1'])
  const INFO_SHEETS = new Set(['INFORMACION','INFO'])
  const ROOM_SHEETS = new Set(['ROOMLIST','HABITACIONES','HOJA4','SHEET4'])
  const GENERIC_ABONO = new Set(['ABONOS','ABONO','DATOS','SHEET2','HOJA2','HOJA3','SHEET3'])

  for (const sheetName of wb.SheetNames) {
    const upper = sheetName.toUpperCase().trim()
    const ws = wb.Sheets[sheetName]

    if (SKIP_SHEETS.has(upper)) continue
    if (upper === 'CONTACTO') { contactoMap = parseContactoSheet(ws); continue }
    if (INFO_SHEETS.has(upper)) { infoMap = parseInfoSheet(ws); continue }
    if (ROOM_SHEETS.has(upper)) { const h = parseRoomlistSheet(ws); if (h.length) result.habitaciones = h; continue }
    if (upper.includes('ESPERA')) {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
      for (const r of rows) {
        const texts = (r as unknown[]).map(v => String(v ?? '').trim()).filter(v => v && v !== 'null')
        const n = texts.find(t => isName(t))
        if (n) result.lista_espera.push({ nombre: n, celular: texts.find(t => t.replace(/\D/g,'').length >= 7), personas: 1 })
      }
      continue
    }

    // All other sheets = abono data
    const seccion = GENERIC_ABONO.has(upper) ? undefined : sheetName
    const parsed = parseAbonosSheet(ws, seccion)
    if (parsed.length > 0) allViajeros.push(...parsed)
  }

  // Merge
  const merged = new Map<string, ParsedExcelData['viajeros'][0]>()
  for (const v of allViajeros) {
    if (!v.nombre || merged.has(v.nombre)) continue
    const info = infoMap.get(v.nombre) ?? {}
    merged.set(v.nombre, {
      ...v,
      fecha_inscripcion: info.fecha_inscripcion,
      talla: info.talla ?? v.talla,
      celular: info.celular ?? v.celular,
      correo: info.correo,
      descuento: info.descuento,
      contacto: contactoMap.get(v.nombre),
    })
  }

  // Add from info not in abonos
  for (const [nombre, info] of infoMap) {
    if (!merged.has(nombre) && isName(nombre)) {
      merged.set(nombre, {
        nombre, estado: 'activo', es_coordinador: false, es_operador: false,
        total_pagado: 0, total_costo: 0, saldo_pendiente: 0, abonos: [],
        contacto: contactoMap.get(nombre), ...info,
      })
    }
  }

  result.viajeros = Array.from(merged.values())
  return result
}
