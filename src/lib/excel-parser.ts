import * as XLSX from 'xlsx'

export interface ParsedExcelData {
  viaje: { nombre: string; nombre_archivo: string }
  secciones: {
    nombre: string
    precio_cuadruple?: number
    precio_triple?: number
    precio_doble?: number
    precio_individual?: number
    costo_transporte?: number
    costo_kit?: number
    costo_gastos?: number
  }[]
  viajeros: {
    nombre: string
    fecha_inscripcion?: string
    talla?: string
    celular?: string
    correo?: string
    descuento?: string
    tipo_habitacion?: string
    seccion_boleto?: string
    estado: string
    es_coordinador: boolean
    es_operador: boolean
    total_pagado: number
    total_costo: number
    saldo_pendiente: number
    abonos: number[]
    contacto?: { nombre?: string; parentesco?: string; numero?: string }
  }[]
  habitaciones: { numero_cuarto: string; tipo?: string; viajeros: string[] }[]
  lista_espera: { nombre: string; celular?: string; personas: number }[]
}

function isName(val: unknown): boolean {
  if (!val) return false
  const s = String(val).trim()
  if (s.length < 3) return false
  if (/^\d+([.,]\d+)?$/.test(s)) return false
  if (s.includes('@')) return false
  const skip = ['VIAJERO','NOMBRE','INFORMACI','CELULAR','TALLA','CUARTO',
    'TOTAL','DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL','TRANSPORTE','KIT','GASTOS',
    'CANCHA','GNP','BACHATA','DIAMANTE','BEYOND','PLATINO','VIP','GENERAL','STAY',
    'DATOS','INFO','CONTACTO','COLUMN','PARENTESCO','NUMERO','CORREO','DESCUENTO',
    'FECHA','NAN','UNDEFINED','NULL','VUELOS','TRASLADOS','BOLETOS',
    'COORDINADOR','OPERADOR','DADO','BAJA','NUEVOS','COSTOS','RESERVACION',
    'SHEET','HOJA','TABLAS','ABONO','ROOMLIST','HABITACION']
  return !skip.some(k => s.toUpperCase().includes(k))
}

function toNum(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

function toDate(val: unknown): string | undefined {
  if (!val) return undefined
  try {
    if (val instanceof Date) return val.toISOString().split('T')[0]
    const s = String(val)
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0, 10)
    if (s.includes('T')) return s.split('T')[0]
  } catch {}
  return undefined
}

function getRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })
}

function parseAbonosRows(rows: unknown[][], seccionName?: string): ParsedExcelData['viajeros'] {
  const result: ParsedExcelData['viajeros'] = []
  const TIPOS = ['DOBLE','TRIPLE','CUADRUPLE','CUADRUPLE','INDIVIDUAL']
  const TALLAS = ['XS','S','M','L','XL','2XL','XXL','2xl','xl','xs','s','m','l']

  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const cells = row as unknown[]
    let nameIdx = -1
    let nombre = ''
    for (let i = 0; i < Math.min(cells.length, 4); i++) {
      const v = String(cells[i] ?? '').trim()
      if (isName(v)) { nameIdx = i; nombre = v; break }
    }
    if (!nombre) continue

    const nums: number[] = []
    for (let i = nameIdx + 1; i < cells.length; i++) {
      const n = toNum(cells[i])
      if (n !== undefined && n > 0) nums.push(n)
    }

    let total_pagado = 0, total_costo = 0, saldo_pendiente = 0
    let abonos: number[] = []
    if (nums.length >= 3) {
      saldo_pendiente = nums[nums.length - 1]
      total_costo = nums[nums.length - 2]
      total_pagado = nums[nums.length - 3]
      abonos = nums.slice(0, nums.length - 3)
    } else if (nums.length === 2) {
      total_pagado = nums[0]; total_costo = nums[1]
      saldo_pendiente = Math.max(0, total_costo - total_pagado)
    } else if (nums.length === 1) {
      total_pagado = nums[0]
    }

    const texts: string[] = []
    for (let i = nameIdx + 1; i < cells.length; i++) {
      const v = String(cells[i] ?? '').trim()
      if (v && v !== 'null' && v !== 'NaN' && isNaN(Number(v))) texts.push(v)
    }

    const tipo_habitacion = texts.find(t => TIPOS.includes(t.toUpperCase().replace('Á','A')))
    const talla = texts.find(t => TALLAS.includes(t))
    const celular = texts.find(t => /^[\d\s\(\)\-\.]{7,}$/.test(t))
    const seccion = seccionName ?? texts.find(t =>
      !TIPOS.includes(t.toUpperCase().replace('Á','A')) &&
      !TALLAS.includes(t) &&
      !/^[\d\s\(\)\-\.]{7,}$/.test(t) &&
      t.length > 1 && !['L','M','NaN','null'].includes(t)
    )

    let tipoFmt: string | undefined
    if (tipo_habitacion) {
      const u = tipo_habitacion.toUpperCase().replace('Á','A')
      if (u === 'DOBLE') tipoFmt = 'Doble'
      else if (u === 'TRIPLE') tipoFmt = 'Triple'
      else if (u === 'CUADRUPLE') tipoFmt = 'Cuadruple'
      else if (u === 'INDIVIDUAL') tipoFmt = 'Individual'
      else tipoFmt = tipo_habitacion
    }

    result.push({
      nombre, talla, celular,
      tipo_habitacion: tipoFmt,
      seccion_boleto: seccion,
      estado: 'activo', es_coordinador: false, es_operador: false,
      total_pagado, total_costo, saldo_pendiente, abonos,
    })
  }
  return result
}

function parseInfoRows(rows: unknown[][]): Map<string, Partial<ParsedExcelData['viajeros'][0]>> {
  const map = new Map<string, Partial<ParsedExcelData['viajeros'][0]>>()
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const cells = row as unknown[]
    let fecha: string | undefined, nombre = '', talla: string | undefined
    let celular: string | undefined, correo: string | undefined, descuento: string | undefined

    for (const cell of cells) {
      const v = String(cell ?? '').trim()
      if (!v || v === 'null' || v === 'NaN') continue
      if (cell instanceof Date || (typeof cell === 'number' && cell > 40000 && cell < 55000)) {
        fecha = toDate(cell); continue
      }
      if (v.includes('@') && !correo) { correo = v; continue }
      if (['XS','S','M','L','XL','2XL','XXL','-'].includes(v.toUpperCase()) && !talla) { talla = v; continue }
      if ((v.toLowerCase().includes('desc') || v.toLowerCase().includes('frec')) && !descuento) { descuento = v; continue }
      if (/^[\d\s\(\)\-\.]{7,}$/.test(v) && !celular) { celular = v; continue }
      if (isName(v) && !nombre) { nombre = v; continue }
    }
    if (nombre) map.set(nombre, { fecha_inscripcion: fecha, talla, celular, correo, descuento })
  }
  return map
}

function parseContactoRows(rows: unknown[][]): Map<string, ParsedExcelData['viajeros'][0]['contacto']> {
  const map = new Map<string, ParsedExcelData['viajeros'][0]['contacto']>()
  const PARENTESCOS = ['PAREJA','ESPOSO','ESPOSA','MADRE','PADRE','HERMANO','HERMANA',
    'HIJO','HIJA','AMIGO','AMIGA','ABUELO','ABUELA','ABUELITA','NOVIO','NOVIA','PRIMO','PRIMA']
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const texts = (row as unknown[]).map(v => String(v ?? '').trim()).filter(v => v && v !== 'null' && v !== 'NaN')
    if (texts.some(t => ['VIAJERO','NOMBRE','PARENTESCO','NUMERO'].includes(t.toUpperCase()))) continue
    const names = texts.filter(t => isName(t))
    if (names.length < 1) continue
    const viajero = names[0]
    const contactoNombre = names[1]
    const parentesco = texts.find(t => PARENTESCOS.includes(t.toUpperCase()))
    const numero = texts.find(t => /\d{7,}/.test(t.replace(/\D/g,'')))
    map.set(viajero, { nombre: contactoNombre, parentesco, numero })
  }
  return map
}

function parseRoomlistRows(rows: unknown[][]): ParsedExcelData['habitaciones'] {
  const habs: ParsedExcelData['habitaciones'] = []
  let headerRow = -1
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (Array.isArray(row) && row.some(v => /cuarto\s*\d*/i.test(String(v ?? '')))) {
      headerRow = i; break
    }
  }
  if (headerRow < 0) return habs

  const headers = rows[headerRow] as unknown[]
  const cols: { idx: number; nombre: string }[] = []
  for (let i = 0; i < headers.length; i++) {
    const v = String(headers[i] ?? '').trim()
    if (/cuarto\s*\d*/i.test(v)) cols.push({ idx: i, nombre: v.trim() })
  }

  const cuartoData = new Map<number, { nombre: string; tipo?: string; viajeros: string[] }>()
  cols.forEach(c => cuartoData.set(c.idx, { nombre: c.nombre, viajeros: [] }))

  const TIPOS = ['DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL']
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!Array.isArray(row)) continue
    for (const c of cols) {
      const v = String(row[c.idx] ?? '').trim()
      if (!v || v === 'null') continue
      const d = cuartoData.get(c.idx)!
      if (TIPOS.includes(v.toUpperCase().replace('Á','A'))) d.tipo = v
      else if (isName(v)) d.viajeros.push(v)
    }
  }

  cuartoData.forEach(d => {
    if (d.viajeros.length > 0 || d.tipo)
      habs.push({ numero_cuarto: d.nombre, tipo: d.tipo, viajeros: d.viajeros })
  })
  return habs
}

export function parseExcelFile(buffer: ArrayBuffer, filename: string): ParsedExcelData {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const nombre = filename.replace(/\.xlsx?$/i, '').replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  const result: ParsedExcelData = {
    viaje: { nombre, nombre_archivo: filename },
    secciones: [{ nombre: 'General', costo_transporte: 780, costo_kit: 170, costo_gastos: 900 }],
    viajeros: [], habitaciones: [], lista_espera: [],
  }

  const allViajeros: ParsedExcelData['viajeros'] = []
  let infoMap = new Map<string, Partial<ParsedExcelData['viajeros'][0]>>()
  let contactoMap = new Map<string, ParsedExcelData['viajeros'][0]['contacto']>()

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const rows = getRows(sheet)
    const upper = sheetName.toUpperCase().trim()

    if (upper === 'INFORMACION' || upper === 'INFO') {
      infoMap = parseInfoRows(rows); continue
    }
    if (upper === 'CONTACTO') {
      contactoMap = parseContactoRows(rows); continue
    }
    if (upper === 'ROOMLIST' || upper === 'HABITACIONES' || upper === 'HOJA4' || upper === 'SHEET4') {
      const h = parseRoomlistRows(rows)
      if (h.length > 0) result.habitaciones = h
      continue
    }
    if (upper.includes('ESPERA')) {
      for (const row of rows) {
        if (!Array.isArray(row)) continue
        const texts = (row as unknown[]).map(v => String(v ?? '').trim()).filter(Boolean)
        const n = texts.find(t => isName(t))
        if (!n) continue
        const cel = texts.find(t => /\d{7,}/.test(t.replace(/\D/g,'')))
        result.lista_espera.push({ nombre: n, celular: cel, personas: 1 })
      }
      continue
    }
    // Skip price/tablas sheets
    if (upper === 'TABLAS' || upper === 'HOJA1' || upper === 'SHEET1') continue

    // All other sheets = abono data
    const genericNames = ['ABONOS','ABONO','DATOS','SHEET2','HOJA2','HOJA3','SHEET3']
    const seccion = genericNames.includes(upper) ? undefined : sheetName
    const parsed = parseAbonosRows(rows, seccion)
    if (parsed.length > 0) allViajeros.push(...parsed)
  }

  const merged = new Map<string, ParsedExcelData['viajeros'][0]>()
  for (const v of allViajeros) {
    if (!v.nombre || merged.has(v.nombre)) continue
    const info = infoMap.get(v.nombre) ?? {}
    const contacto = contactoMap.get(v.nombre)
    merged.set(v.nombre, {
      ...v,
      fecha_inscripcion: info.fecha_inscripcion ?? v.fecha_inscripcion,
      talla: info.talla ?? v.talla,
      celular: info.celular ?? v.celular,
      correo: info.correo,
      descuento: info.descuento,
      contacto,
    })
  }

  for (const [nombre, info] of infoMap) {
    if (!merged.has(nombre) && isName(nombre)) {
      merged.set(nombre, {
        nombre, estado: 'activo', es_coordinador: false, es_operador: false,
        total_pagado: 0, total_costo: 0, saldo_pendiente: 0, abonos: [],
        contacto: contactoMap.get(nombre), ...info,
      })
    }
  }

  result.viajeros = Array.from(merged.values()).filter(v => v.nombre.length > 2)
  return result
}
