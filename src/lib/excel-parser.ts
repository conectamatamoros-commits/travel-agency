import * as XLSX from 'xlsx'

export interface ParsedExcelData {
  viaje: {
    nombre: string
    nombre_archivo: string
  }
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
    ciudadania?: string
    fecha_nacimiento?: string
    estado: string
    es_coordinador: boolean
    es_operador: boolean
    total_pagado: number
    total_costo: number
    saldo_pendiente: number
    abonos: number[]
    contacto?: {
      nombre?: string
      parentesco?: string
      numero?: string
    }
  }[]
  habitaciones: {
    numero_cuarto: string
    tipo?: string
    viajeros: string[]
  }[]
  lista_espera: {
    nombre: string
    celular?: string
    personas: number
  }[]
}

function cleanText(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined
  const s = String(val).trim()
  return s === '' || s === 'NaN' || s === 'undefined' ? undefined : s
}

function cleanNumber(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

function isValidName(val: unknown): boolean {
  const s = cleanText(val)
  if (!s) return false
  if (s.length < 3) return false
  if (/^\d+$/.test(s)) return false
  const keywords = ['VIAJERO','NOMBRE','INFORMACIÓN','CELULAR','TALLA','CUARTO','NaN','TOTAL','DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL','TRANSPORTE','KIT','GASTOS','CANCHA','GNP','BACHATA','DIAMANTE','BEYOND','PLATINO','VIP','GENERAL','STAY','DATOS','INFO','CONTACTO','COLUMN']
  return !keywords.some(k => s.toUpperCase().includes(k))
}

function parseDate(val: unknown): string | undefined {
  if (!val) return undefined
  try {
    if (val instanceof Date) return val.toISOString().split('T')[0]
    if (typeof val === 'number') {
      // Excel serial date
      const date = new Date((val - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }
    const s = String(val).trim()
    if (s.includes('T')) return s.split('T')[0]
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0,10)
  } catch {}
  return undefined
}

function parseTablasSheet(sheet: XLSX.WorkSheet): ParsedExcelData['secciones'] {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })
  const secciones: ParsedExcelData['secciones'] = []
  
  let transporte = 780, kit = 170, gastos = 900
  
  for (const row of data as unknown[][]) {
    if (!Array.isArray(row)) continue
    for (let i = 0; i < row.length - 2; i++) {
      const label = cleanText(row[i])?.toUpperCase()
      if (!label) continue
      if (label === 'TRANSPORTE') transporte = cleanNumber(row[i+1]) ?? transporte
      if (label === 'KIT') kit = cleanNumber(row[i+1]) ?? kit
      if (label === 'GASTOS') gastos = cleanNumber(row[i+1]) ?? gastos
    }
  }

  // Extract ticket sections - look for price tables
  const seccionNames = new Set<string>()
  for (const row of data as unknown[][]) {
    if (!Array.isArray(row)) continue
    for (let i = 0; i < row.length; i++) {
      const label = cleanText(row[i])?.toUpperCase()
      if (label && !['CUADRUPLE','TRIPLE','DOBLE','INDIVIDUAL','TRANSPORTE','KIT','GASTOS','TOTAL','NaN','STAY','BOLETOS','VUELOS','TRASLADOS'].includes(label) && 
          !label.match(/^\d/) && label.length > 1) {
        const precio = cleanNumber(row[i+1])
        if (precio && precio > 500) {
          seccionNames.add(cleanText(row[i])!)
        }
      }
    }
  }

  // Find cuadruple/triple/doble/individual prices for each section context
  for (const row of data as unknown[][]) {
    if (!Array.isArray(row)) continue
    // Look for price rows with CUADRUPLE pattern
    for (let i = 0; i < row.length - 2; i++) {
      const label = cleanText(row[i])?.toUpperCase()
      if (label === 'CUADRUPLE' || label === 'CUÁDRUPLE') {
        const precioC = cleanNumber(row[i+1])
        // Find matching section in nearby rows - simplified: extract all 4 prices from row context
        let precioT: number | undefined, precioD: number | undefined, precioI: number | undefined
        for (let j = i+2; j < Math.min(row.length, i+12); j++) {
          const l2 = cleanText(row[j])?.toUpperCase()
          if (l2 === 'TRIPLE') precioT = cleanNumber(row[j+1])
          if (l2 === 'DOBLE') precioD = cleanNumber(row[j+1])
          if (l2 === 'INDIVIDUAL') precioI = cleanNumber(row[j+1])
        }
        if (precioC && secciones.length === 0) {
          secciones.push({
            nombre: 'General',
            precio_cuadruple: precioC,
            precio_triple: precioT,
            precio_doble: precioD,
            precio_individual: precioI,
            costo_transporte: transporte,
            costo_kit: kit,
            costo_gastos: gastos,
          })
        }
        break
      }
    }
  }

  // Add named sections
  seccionNames.forEach(name => {
    if (!secciones.find(s => s.nombre === name)) {
      secciones.push({ nombre: name, costo_transporte: transporte, costo_kit: kit, costo_gastos: gastos })
    }
  })

  if (secciones.length === 0) {
    secciones.push({ nombre: 'General', costo_transporte: transporte, costo_kit: kit, costo_gastos: gastos })
  }

  return secciones
}

function parseAbonosSheet(rows: unknown[][]): ParsedExcelData['viajeros'] {
  const viajeros: ParsedExcelData['viajeros'] = []

  for (const row of rows) {
    if (!Array.isArray(row)) continue
    
    // Find name column - usually col 1 or 2
    let nameIdx = -1
    let nameVal: string | undefined
    
    for (let i = 0; i < Math.min(row.length, 4); i++) {
      const v = cleanText(row[i])
      if (v && isValidName(v)) {
        nameIdx = i
        nameVal = v
        break
      }
    }
    
    if (!nameVal || nameIdx < 0) continue

    // Status: L = liquidado/completo, M = en proceso, first column often
    const statusCol = cleanText(row[0])?.toUpperCase()
    const esBaja = statusCol === undefined && cleanText(row[nameIdx-1])?.toUpperCase() === undefined

    // Collect numeric values after name
    const numerics: number[] = []
    for (let i = nameIdx + 1; i < row.length; i++) {
      const n = cleanNumber(row[i])
      if (n !== undefined && n > 0) numerics.push(n)
    }

    // Abonos = all numerics except last 3 (total_pagado, total_costo, saldo)
    let abonos: number[] = []
    let total_pagado = 0, total_costo = 0, saldo_pendiente = 0

    if (numerics.length >= 3) {
      saldo_pendiente = numerics[numerics.length - 1]
      total_costo = numerics[numerics.length - 2]
      total_pagado = numerics[numerics.length - 3]
      abonos = numerics.slice(0, numerics.length - 3)
    } else if (numerics.length > 0) {
      total_pagado = numerics[0]
    }

    // Find text values after numerics for habitacion, seccion, talla, celular
    const textVals: string[] = []
    for (let i = nameIdx + 1; i < row.length; i++) {
      const v = cleanText(row[i])
      if (v && isNaN(Number(v)) && v.length > 0) textVals.push(v)
    }

    // Identify tipo_habitacion
    const tiposHab = ['DOBLE', 'TRIPLE', 'CUADRUPLE', 'CUÁDRUPLE', 'INDIVIDUAL']
    const tipo_habitacion = textVals.find(v => tiposHab.includes(v.toUpperCase()))

    // Identify seccion_boleto (non-talla, non-habitacion text)
    const tallas = ['XS','S','M','L','XL','2XL','2xl','xl']
    const talla = textVals.find(v => tallas.includes(v))
    
    // Everything else could be seccion
    const seccion_boleto = textVals.find(v => 
      !tiposHab.includes(v.toUpperCase()) && 
      !tallas.includes(v) &&
      !v.match(/^\d{7,}$/) && // not a phone
      v.length > 1
    )

    // Phone-like values
    const celular = textVals.find(v => v.match(/^[\d\s\-\(\)]{7,}$/))

    viajeros.push({
      nombre: nameVal,
      tipo_habitacion,
      seccion_boleto,
      talla,
      celular,
      estado: 'activo',
      es_coordinador: false,
      es_operador: false,
      total_pagado,
      total_costo,
      saldo_pendiente,
      abonos,
    })
  }

  return viajeros
}

function parseInfoSheet(rows: unknown[][]): Map<string, Partial<ParsedExcelData['viajeros'][0]>> {
  const map = new Map<string, Partial<ParsedExcelData['viajeros'][0]>>()
  
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    
    // Find name
    let nombre: string | undefined
    let fecha: string | undefined
    let talla: string | undefined
    let celular: string | undefined
    let correo: string | undefined
    let descuento: string | undefined
    let ciudadania: string | undefined
    let fecha_nacimiento: string | undefined

    for (let i = 0; i < row.length; i++) {
      const v = cleanText(row[i])
      if (!v) continue
      
      // Date
      if (row[i] instanceof Date || (typeof row[i] === 'number' && row[i] > 40000 && row[i] < 50000)) {
        fecha = parseDate(row[i])
        continue
      }
      
      if (isValidName(v) && !nombre) {
        nombre = v
        continue
      }
      
      // Talla
      if (['XS','S','M','L','XL','2XL','XXL','-'].includes(v.toUpperCase()) && !talla) {
        talla = v
        continue
      }
      
      // Email
      if (v.includes('@') && !correo) {
        correo = v
        continue
      }
      
      // Ciudadania
      if (v.toLowerCase() === 'mex' || v.toLowerCase() === 'usa') {
        ciudadania = v
        continue
      }

      // Descuento
      if (v.toLowerCase().includes('desc') || v.toLowerCase().includes('frec')) {
        descuento = v
        continue
      }
      
      // Celular (contains digits)
      if (v.match(/[\d\s]{7,}/) && !celular) {
        celular = v
        continue
      }
      
      // Fecha nacimiento
      if (v.match(/\d{1,2}\s+de\s+\w+/i) && !fecha_nacimiento) {
        fecha_nacimiento = v
        continue
      }
    }
    
    if (nombre) {
      map.set(nombre, { fecha_inscripcion: fecha, talla, celular, correo, descuento, ciudadania, fecha_nacimiento })
    }
  }
  
  return map
}

function parseContactoSheet(rows: unknown[][]): Map<string, ParsedExcelData['viajeros'][0]['contacto']> {
  const map = new Map<string, ParsedExcelData['viajeros'][0]['contacto']>()
  
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    
    const texts = row.map(v => cleanText(v)).filter(Boolean) as string[]
    if (texts.length < 2) continue
    
    // Skip header rows
    if (texts.some(t => ['VIAJERO','NOMBRE','PARENTESCO','NUMERO'].includes(t.toUpperCase()))) continue
    
    // First valid name = viajero, second = contacto nombre
    const names = texts.filter(t => isValidName(t))
    if (names.length < 1) continue
    
    const viajeroName = names[0]
    const contactoName = names[1]
    
    // Parentesco
    const parentescos = ['PAREJA','ESPOSO','ESPOSA','MADRE','PADRE','HERMANO','HERMANA','HIJO','HIJA','AMIGO','AMIGA','ABUELO','ABUELA','ABUELITA']
    const parentesco = texts.find(t => parentescos.includes(t.toUpperCase()))
    
    // Numero
    const numero = texts.find(t => t.match(/[\d\s\-\(\)]{7,}/))
    
    map.set(viajeroName, { nombre: contactoName, parentesco, numero })
  }
  
  return map
}

function parseRoomlistSheet(rows: unknown[][]): ParsedExcelData['habitaciones'] {
  const habitaciones: ParsedExcelData['habitaciones'] = []
  
  // Find the row with "Cuarto 1", "Cuarto 2" etc
  let headerRow = -1
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (Array.isArray(row) && row.some(v => cleanText(v)?.match(/cuarto\s*\d+/i))) {
      headerRow = i
      break
    }
  }
  
  if (headerRow < 0) return habitaciones
  
  const headers = rows[headerRow] as unknown[]
  const cuartos: { idx: number; nombre: string }[] = []
  
  for (let i = 0; i < headers.length; i++) {
    const v = cleanText(headers[i])
    if (v?.match(/cuarto\s*\d*/i)) {
      cuartos.push({ idx: i, nombre: v })
    }
  }
  
  // Collect names per cuarto from subsequent rows
  const cuartoMap = new Map<number, { nombre: string; tipo?: string; viajeros: string[] }>()
  cuartos.forEach(c => cuartoMap.set(c.idx, { nombre: c.nombre, viajeros: [] }))
  
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!Array.isArray(row)) continue
    
    for (const c of cuartos) {
      const v = cleanText(row[c.idx])
      if (!v) continue
      const tiposHab = ['DOBLE','TRIPLE','CUADRUPLE','CUÁDRUPLE','INDIVIDUAL']
      if (tiposHab.includes(v.toUpperCase())) {
        const cuarto = cuartoMap.get(c.idx)!
        cuarto.tipo = v
      } else if (isValidName(v)) {
        const cuarto = cuartoMap.get(c.idx)!
        cuarto.viajeros.push(v)
      }
    }
  }
  
  cuartoMap.forEach((cuarto, _idx) => {
    if (cuarto.viajeros.length > 0 || cuarto.tipo) {
      habitaciones.push({
        numero_cuarto: cuarto.nombre,
        tipo: cuarto.tipo,
        viajeros: cuarto.viajeros,
      })
    }
  })
  
  return habitaciones
}

function parseListaEspera(rows: unknown[][]): ParsedExcelData['lista_espera'] {
  const lista: ParsedExcelData['lista_espera'] = []
  
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const texts = (row as unknown[]).map(v => cleanText(v)).filter(Boolean) as string[]
    if (texts.length < 1) continue
    
    const nombre = texts.find(t => isValidName(t))
    if (!nombre) continue
    
    const celular = texts.find(t => t.match(/[\d\s\-]{7,}/))
    const personas = texts.reduce((acc, t) => {
      const m = t.match(/(\d+)\s*persona/i)
      return m ? parseInt(m[1]) : acc
    }, 1)
    
    lista.push({ nombre, celular, personas })
  }
  
  return lista
}

export function parseExcelFile(buffer: ArrayBuffer, filename: string): ParsedExcelData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  
  // Derive trip name from filename
  const nombre = filename
    .replace(/\.xlsx?$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  const result: ParsedExcelData = {
    viaje: { nombre, nombre_archivo: filename },
    secciones: [],
    viajeros: [],
    habitaciones: [],
    lista_espera: [],
  }

  let allViajeros: ParsedExcelData['viajeros'] = []
  let infoMap = new Map<string, Partial<ParsedExcelData['viajeros'][0]>>()
  let contactoMap = new Map<string, ParsedExcelData['viajeros'][0]['contacto']>()

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })
    const upper = sheetName.toUpperCase()

    // TABLAS / precio sheet
    if (upper.includes('TABLA') || upper.includes('HOJA1') || upper.includes('SHEET1') || upper === 'TABLAS') {
      if (result.secciones.length === 0) {
        result.secciones = parseTablasSheet(sheet)
      }
    }

    // ABONOS / payments sheets
    if (upper.includes('ABONO') || upper.includes('DATOS') || upper.includes('GNP') || 
        upper.includes('CANCHA') || upper.includes('HOJA2') || upper.includes('SHEET2') ||
        (!upper.includes('INFO') && !upper.includes('CONTACT') && !upper.includes('ROOM') && !upper.includes('HABIT') && !upper.includes('ESPERA') && !upper.includes('TABLA') && !upper.includes('SHEET1') && !upper.includes('HOJA1'))) {
      const parsed = parseAbonosSheet(rows as unknown[][])
      allViajeros = [...allViajeros, ...parsed]
    }

    // INFO
    if (upper.includes('INFO') || upper.includes('INFORMAC')) {
      infoMap = parseInfoSheet(rows as unknown[][])
    }

    // CONTACTO
    if (upper.includes('CONTACTO')) {
      contactoMap = parseContactoSheet(rows as unknown[][])
    }

    // ROOMLIST / HABITACIONES
    if (upper.includes('ROOM') || upper.includes('HABIT') || upper.includes('HOJA4') || upper.includes('SHEET4')) {
      const parsed = parseRoomlistSheet(rows as unknown[][])
      if (parsed.length > 0) result.habitaciones = parsed
    }

    // LISTA DE ESPERA
    if (upper.includes('ESPERA')) {
      result.lista_espera = parseListaEspera(rows as unknown[][])
    }
  }

  // Merge info and contacto into viajeros
  const merged = new Map<string, ParsedExcelData['viajeros'][0]>()
  
  for (const v of allViajeros) {
    if (!v.nombre || merged.has(v.nombre)) continue
    
    const info = infoMap.get(v.nombre) ?? {}
    const contacto = contactoMap.get(v.nombre)
    
    merged.set(v.nombre, {
      ...v,
      ...info,
      // Prefer abonos sheet values for payments
      total_pagado: v.total_pagado,
      total_costo: v.total_costo,
      saldo_pendiente: v.saldo_pendiente,
      abonos: v.abonos,
      contacto,
    })
  }

  // Also add from infoMap if not in abonos
  for (const [nombre, info] of infoMap) {
    if (!merged.has(nombre) && isValidName(nombre)) {
      merged.set(nombre, {
        nombre,
        estado: 'activo',
        es_coordinador: false,
        es_operador: false,
        total_pagado: 0,
        total_costo: 0,
        saldo_pendiente: 0,
        abonos: [],
        contacto: contactoMap.get(nombre),
        ...info,
      })
    }
  }

  result.viajeros = Array.from(merged.values()).filter(v => v.nombre && v.nombre.length > 2)

  return result
}
