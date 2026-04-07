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

const SKIP_WORDS = ['TOTAL','DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL','TRANSPORTE',
  'KIT','GASTOS','GNP','CANCHA','VIP','GENERAL','DADO','BAJA','VIAJERO','NOMBRE',
  'INFORMACI','CELULAR','TALLA','CUARTO','DATOS','INFO','CONTACTO','ABONO',
  'ROOMLIST','HABITACION','TABLAS','HOJA','SHEET','STAY','VUELOS','TRASLADOS']

const TIPO_MAP: Record<string, string> = {
  'DOBLE': 'Doble', 'TRIPLE': 'Triple', 
  'CUADRUPLE': 'Cuadruple', 'CUADRUPLE': 'Cuadruple',
  'INDIVIDUAL': 'Individual'
}

function isViajeroName(val: unknown): boolean {
  if (!val || typeof val !== 'string') return false
  const s = val.trim()
  // Must have a space (first + last name)
  if (!s.includes(' ')) return false
  if (s.length < 6) return false
  // Must start with letter
  if (!/^[A-Za-záéíóúÁÉÍÓÚñÑüÜÄÖÅ]/.test(s)) return false
  // No digits
  if (/\d/.test(s)) return false
  // Not a keyword
  const upper = s.toUpperCase()
  return !SKIP_WORDS.some(k => upper.includes(k))
}

function asNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'))
  return isNaN(n) || n <= 0 ? null : n
}

function parseAbonos(ws: XLSX.WorkSheet, seccionName?: string): ParsedExcelData['viajeros'] {
  const result: ParsedExcelData['viajeros'] = []
  
  // Get raw cell data
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  
  for (let r = range.s.r; r <= range.e.r; r++) {
    // Look for name in columns 0-3
    let nombre = ''
    let nameCol = -1
    
    for (let c = 0; c <= Math.min(3, range.e.c); c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      if (!cell) continue
      const v = cell.v
      if (isViajeroName(v)) {
        nombre = String(v).trim()
        nameCol = c
        break
      }
    }
    
    if (!nombre || nameCol < 0) continue
    
    // Collect numbers and strings after name
    const nums: number[] = []
    const strs: string[] = []
    
    for (let c = nameCol + 1; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      if (!cell || cell.v === null || cell.v === undefined) continue
      
      const n = asNumber(cell.v)
      if (n !== null) {
        nums.push(n)
      } else if (typeof cell.v === 'string' && cell.v.trim()) {
        strs.push(cell.v.trim())
      }
    }
    
    // Last 3 numbers = total_pagado, total_costo, saldo_pendiente
    let total_pagado = 0, total_costo = 0, saldo_pendiente = 0
    let abonos: number[] = []
    
    if (nums.length >= 3) {
      saldo_pendiente = nums[nums.length - 1]
      total_costo = nums[nums.length - 2]
      total_pagado = nums[nums.length - 3]
      abonos = nums.slice(0, nums.length - 3)
    } else if (nums.length === 2) {
      total_pagado = nums[0]
      total_costo = nums[1]
      saldo_pendiente = Math.max(0, total_costo - total_pagado)
    } else if (nums.length === 1) {
      total_pagado = nums[0]
    } else {
      continue // No numbers = not a valid row
    }
    
    // Find tipo habitacion
    const tipoRaw = strs.find(s => TIPO_MAP[s.toUpperCase().replace(/Á/g,'A').replace(/É/g,'E')])
    const tipo_habitacion = tipoRaw ? TIPO_MAP[tipoRaw.toUpperCase().replace(/Á/g,'A').replace(/É/g,'E')] : undefined
    
    // Find talla
    const TALLAS = new Set(['XS','S','M','L','XL','2XL','XXL'])
    const talla = strs.find(s => TALLAS.has(s.toUpperCase()))
    
    // Find celular
    const celular = strs.find(s => /^\d[\d\s\-\.\(\)]{6,}$/.test(s))
    
    // Find seccion
    const seccion = seccionName ?? strs.find(s => 
      !TIPO_MAP[s.toUpperCase().replace(/Á/g,'A')] &&
      !TALLAS.has(s.toUpperCase()) &&
      !/^\d[\d\s\-\.\(\)]{6,}$/.test(s) &&
      s.length > 1 && !['L','M','S','null','NaN'].includes(s)
    )
    
    result.push({
      nombre, talla, celular,
      tipo_habitacion, seccion_boleto: seccion,
      estado: 'activo', es_coordinador: false, es_operador: false,
      total_pagado, total_costo, saldo_pendiente, abonos,
    })
  }
  
  return result
}

function parseInfo(ws: XLSX.WorkSheet): Map<string, Partial<ParsedExcelData['viajeros'][0]>> {
  const map = new Map<string, Partial<ParsedExcelData['viajeros'][0]>>()
  const TALLAS = new Set(['XS','S','M','L','XL','2XL','XXL','-'])
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    let nombre = '', fecha: string|undefined, talla: string|undefined
    let celular: string|undefined, correo: string|undefined, descuento: string|undefined
    
    for (const cell of row) {
      if (cell === null || cell === undefined) continue
      const s = String(cell).trim()
      if (!s || s === 'null') continue
      
      if (s.includes('@') && !correo) { correo = s; continue }
      if (TALLAS.has(s.toUpperCase()) && !talla) { talla = s; continue }
      if ((s.toLowerCase().includes('desc') || s.toLowerCase().includes('frec')) && !descuento) { descuento = s; continue }
      if (/^\d{4}-\d{2}-\d{2}/.test(s) && !fecha) { fecha = s.slice(0,10); continue }
      if (/^\d[\d\s\-\.\(\)]{6,}$/.test(s) && !celular) { celular = s; continue }
      if (isViajeroName(cell) && !nombre) { nombre = s; continue }
    }
    if (nombre) map.set(nombre, { fecha_inscripcion: fecha, talla, celular, correo, descuento })
  }
  return map
}

function parseContacto(ws: XLSX.WorkSheet): Map<string, ParsedExcelData['viajeros'][0]['contacto']> {
  const map = new Map<string, ParsedExcelData['viajeros'][0]['contacto']>()
  const PARENTESCOS = new Set(['PAREJA','ESPOSO','ESPOSA','MADRE','PADRE','HERMANO','HERMANA',
    'HIJO','HIJA','AMIGO','AMIGA','ABUELO','ABUELA','ABUELITA','NOVIO','NOVIA','PRIMO','PRIMA'])
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const texts = row.map(v => String(v ?? '').trim()).filter(v => v && v !== 'null')
    if (texts.some(t => ['VIAJERO','NOMBRE','PARENTESCO','NUMERO'].includes(t.toUpperCase()))) continue
    const names = texts.filter(t => isViajeroName(t))
    if (!names[0]) continue
    const parentesco = texts.find(t => PARENTESCOS.has(t.toUpperCase()))
    const numero = texts.find(t => t.replace(/\D/g,'').length >= 7)
    map.set(names[0], { nombre: names[1], parentesco, numero })
  }
  return map
}

function parseRooms(ws: XLSX.WorkSheet): ParsedExcelData['habitaciones'] {
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
  
  const TIPOS = new Set(['DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL'])
  const cuartos = new Map(cols.map(c => [c.idx, { nombre: c.nombre, tipo: undefined as string|undefined, viajeros: [] as string[] }]))
  
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    for (const c of cols) {
      const v = String(row[c.idx] ?? '').trim()
      if (!v || v === 'null') continue
      const d = cuartos.get(c.idx)!
      if (TIPOS.has(v.toUpperCase().replace(/Á/g,'A'))) d.tipo = v
      else if (isViajeroName(v)) d.viajeros.push(v)
    }
  }
  
  cuartos.forEach(d => {
    if (d.viajeros.length > 0 || d.tipo)
      habs.push({ numero_cuarto: d.nombre, tipo: d.tipo, viajeros: d.viajeros })
  })
  return habs
}

export function parseExcelFile(buffer: ArrayBuffer, filename: string): ParsedExcelData {
  const wb = XLSX.read(buffer, { type: 'array' })
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
    if (!ws || !ws['!ref']) continue

    if (SKIP_SHEETS.has(upper)) continue
    if (upper === 'CONTACTO') { contactoMap = parseContacto(ws); continue }
    if (INFO_SHEETS.has(upper)) { infoMap = parseInfo(ws); continue }
    if (ROOM_SHEETS.has(upper)) { const h = parseRooms(ws); if (h.length) result.habitaciones = h; continue }
    if (upper.includes('ESPERA')) {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
      for (const r of rows) {
        const texts = (r as unknown[]).map(v => String(v ?? '').trim()).filter(v => v && v !== 'null')
        const n = texts.find(t => isViajeroName(t))
        if (n) result.lista_espera.push({ nombre: n, celular: texts.find(t => t.replace(/\D/g,'').length >= 7), personas: 1 })
      }
      continue
    }

    const seccion = GENERIC_ABONO.has(upper) ? undefined : sheetName
    const parsed = parseAbonos(ws, seccion)
    if (parsed.length > 0) allViajeros.push(...parsed)
  }

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

  for (const [nombre, info] of infoMap) {
    if (!merged.has(nombre) && isViajeroName(nombre)) {
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
