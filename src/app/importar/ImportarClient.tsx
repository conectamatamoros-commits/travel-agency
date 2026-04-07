'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Check, X, Loader2, AlertTriangle, Bus } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

interface FileState {
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  message?: string
  viajeId?: string
}

interface Props {
  viajesExistentes: { id: string; nombre: string; created_at: string }[]
  userId: string
}

const SKIP_SHEETS = new Set(['TABLAS','HOJA1','SHEET1'])
const INFO_SHEETS = new Set(['INFORMACION','INFO'])
const ROOM_SHEETS = new Set(['ROOMLIST','HABITACIONES','HOJA4','SHEET4'])
const GENERIC_ABONO = new Set(['ABONOS','ABONO','DATOS','SHEET2','HOJA2','HOJA3','SHEET3'])
const TIPO_MAP: Record<string,string> = { 'DOBLE':'Doble','TRIPLE':'Triple','CUADRUPLE':'Cuadruple','INDIVIDUAL':'Individual' }
const TALLAS = new Set(['XS','S','M','L','XL','2XL','XXL'])

function isName(val: unknown): boolean {
  if (!val || typeof val !== 'string') return false
  const s = val.trim()
  if (!s.includes(' ') || s.length < 6) return false
  if (!/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ]/.test(s)) return false
  if (/\d/.test(s)) return false
  const SKIP = ['TOTAL','DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL','TRANSPORTE','KIT','GASTOS',
    'GNP','CANCHA','VIP','GENERAL','DADO','BAJA','VIAJERO','NOMBRE','INFORMACI','CELULAR',
    'TALLA','CUARTO','DATOS','INFO','CONTACTO','ABONO','ROOMLIST','HABITACION','TABLAS','STAY']
  return !SKIP.some(k => s.toUpperCase().includes(k))
}

function parseSheet(ws: XLSX.WorkSheet, seccionName?: string) {
  const result: object[] = []
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

  for (let r = range.s.r; r <= range.e.r; r++) {
    let nombre = '', nameCol = -1

    for (let c = 0; c <= Math.min(3, range.e.c); c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (cell && isName(cell.v)) { nombre = String(cell.v).trim(); nameCol = c; break }
    }
    if (!nombre) continue

    const nums: number[] = []
    const strs: string[] = []

    for (let c = nameCol + 1; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (!cell || cell.v == null) continue
      if (typeof cell.v === 'number' && cell.v > 0) {
        nums.push(cell.v)
      } else if (typeof cell.v === 'string' && cell.v.trim()) {
        strs.push(cell.v.trim())
      }
    }

    if (nums.length === 0) continue

    let total_pagado = 0, total_costo = 0, saldo_pendiente = 0, abonos: number[] = []
    if (nums.length >= 3) {
      saldo_pendiente = nums[nums.length - 1]
      total_costo = nums[nums.length - 2]
      total_pagado = nums[nums.length - 3]
      abonos = nums.slice(0, nums.length - 3)
    } else if (nums.length === 2) {
      total_pagado = nums[0]; total_costo = nums[1]
      saldo_pendiente = Math.max(0, total_costo - total_pagado)
    } else {
      total_pagado = nums[0]
    }

    const tipoRaw = strs.find(s => TIPO_MAP[s.toUpperCase().replace(/[ÁÀ]/g,'A')])
    const tipo_habitacion = tipoRaw ? TIPO_MAP[tipoRaw.toUpperCase().replace(/[ÁÀ]/g,'A')] : undefined
    const talla = strs.find(s => TALLAS.has(s.toUpperCase()))
    const celular = strs.find(s => /^\d[\d\s\-\.]{6,}$/.test(s))
    const seccion = seccionName ?? strs.find(s =>
      !TIPO_MAP[s.toUpperCase().replace(/[ÁÀ]/g,'A')] && !TALLAS.has(s.toUpperCase()) &&
      !/^\d[\d\s\-\.]{6,}$/.test(s) && s.length > 1 && !['L','M','S','null'].includes(s)
    )

    result.push({ nombre, talla, celular, tipo_habitacion, seccion_boleto: seccion,
      total_pagado, total_costo, saldo_pendiente, abonos })
  }
  return result
}

function parseExcel(buffer: ArrayBuffer, filename: string) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const nombre = filename.replace(/\.xlsx?$/i,'').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())

  const viajeros: object[] = []
  const habitaciones: object[] = []
  const infoMap = new Map<string, object>()
  const contactoMap = new Map<string, object>()

  for (const sheetName of wb.SheetNames) {
    const upper = sheetName.toUpperCase().trim()
    const ws = wb.Sheets[sheetName]
    if (!ws || !ws['!ref']) continue

    if (SKIP_SHEETS.has(upper)) continue

    if (upper === 'CONTACTO') {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
      const PARENTS = new Set(['PAREJA','ESPOSO','ESPOSA','MADRE','PADRE','HERMANO','HERMANA','HIJO','HIJA','AMIGO','AMIGA','ABUELO','ABUELA'])
      for (const row of rows) {
        const texts = (row as unknown[]).map(v => String(v ?? '').trim()).filter(v => v && v !== 'null')
        if (texts.some(t => ['VIAJERO','NOMBRE','PARENTESCO','NUMERO'].includes(t.toUpperCase()))) continue
        const names = texts.filter(t => isName(t))
        if (!names[0]) continue
        const parentesco = texts.find(t => PARENTS.has(t.toUpperCase()))
        const numero = texts.find(t => t.replace(/\D/g,'').length >= 7)
        contactoMap.set(names[0], { nombre: names[1], parentesco, numero })
      }
      continue
    }

    if (INFO_SHEETS.has(upper)) {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
      for (const row of rows) {
        let nombre = '', fecha: string|undefined, talla: string|undefined, celular: string|undefined, correo: string|undefined, descuento: string|undefined
        for (const cell of row as unknown[]) {
          if (!cell) continue
          const s = String(cell).trim()
          if (!s || s === 'null') continue
          if (s.includes('@') && !correo) { correo = s; continue }
          if (TALLAS.has(s.toUpperCase()) && !talla) { talla = s; continue }
          if (s.toLowerCase().includes('desc') && !descuento) { descuento = s; continue }
          if (/^\d{4}-\d{2}-\d{2}/.test(s) && !fecha) { fecha = s.slice(0,10); continue }
          if (/^\d[\d\s\-\.]{6,}$/.test(s) && !celular) { celular = s; continue }
          if (isName(cell) && !nombre) { nombre = s; continue }
        }
        if (nombre) infoMap.set(nombre, { fecha_inscripcion: fecha, talla, celular, correo, descuento })
      }
      continue
    }

    if (ROOM_SHEETS.has(upper)) {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
      let headerRow = -1
      for (let i = 0; i < rows.length; i++) {
        if ((rows[i] as unknown[]).some(v => /cuarto\s*\d*/i.test(String(v ?? '')))) { headerRow = i; break }
      }
      if (headerRow >= 0) {
        const headers = rows[headerRow] as unknown[]
        const cols: { idx: number; nombre: string }[] = []
        headers.forEach((v, i) => { const s = String(v ?? '').trim(); if (/cuarto\s*\d*/i.test(s)) cols.push({ idx: i, nombre: s }) })
        const cuartos = new Map(cols.map(c => [c.idx, { numero_cuarto: c.nombre, tipo: undefined as string|undefined, viajeros: [] as string[] }]))
        for (let i = headerRow + 1; i < rows.length; i++) {
          const row = rows[i] as unknown[]
          for (const c of cols) {
            const v = String(row[c.idx] ?? '').trim()
            if (!v || v === 'null') continue
            const d = cuartos.get(c.idx)!
            if (['DOBLE','TRIPLE','CUADRUPLE','INDIVIDUAL'].includes(v.toUpperCase().replace(/Á/g,'A'))) d.tipo = v
            else if (isName(v)) d.viajeros.push(v)
          }
        }
        cuartos.forEach(d => { if (d.viajeros.length > 0 || d.tipo) habitaciones.push(d) })
      }
      continue
    }

    const seccion = GENERIC_ABONO.has(upper) ? undefined : sheetName
    const parsed = parseSheet(ws, seccion)
    viajeros.push(...parsed)
  }

  // Merge info into viajeros
  const merged = new Map<string, Record<string, unknown>>()
  for (const v of viajeros as Record<string, unknown>[]) {
    if (!v.nombre || merged.has(v.nombre as string)) continue
    const info = infoMap.get(v.nombre as string) as Record<string, unknown> ?? {}
    merged.set(v.nombre as string, {
      ...v,
      fecha_inscripcion: info.fecha_inscripcion,
      talla: info.talla ?? v.talla,
      celular: info.celular ?? v.celular,
      correo: info.correo,
      descuento: info.descuento,
      contacto: contactoMap.get(v.nombre as string),
    })
  }

  return {
    nombre, nombre_archivo: filename,
    viajeros: Array.from(merged.values()),
    habitaciones,
  }
}

export default function ImportarClient({ viajesExistentes, userId }: Props) {
  const [files, setFiles] = useState<FileState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: File[]) {
    const xlsxFiles = newFiles.filter(f => f.name.match(/\.xlsx?$/i))
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.file.name))
      const toAdd = xlsxFiles.filter(f => !existing.has(f.name))
      return [...prev, ...toAdd.map(f => ({ file: f, status: 'pending' as const }))]
    })
  }

  async function processFile(index: number) {
    const fs = files[index]
    if (!fs || fs.status !== 'pending') return
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'processing' } : f))

    try {
      const buffer = await fs.file.arrayBuffer()
      const data = parseExcel(buffer, fs.file.name)

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viajeData: data, userId }),
      })
      const result = await res.json()

      if (res.ok) {
        setFiles(prev => prev.map((f, i) => i === index ? {
          ...f, status: 'done',
          message: `${result.viajeros} viajeros · ${result.habitaciones} cuartos importados`,
          viajeId: result.viajeId,
        } : f))
      } else {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', message: result.error } : f))
      }
    } catch (err) {
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', message: String(err) } : f))
    }
  }

  async function processAll() {
    setIsProcessing(true)
    const pending = files.map((f, i) => f.status === 'pending' ? i : -1).filter(i => i >= 0)
    for (const idx of pending) await processFile(idx)
    setIsProcessing(false)
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const doneCount = files.filter(f => f.status === 'done').length

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
          onClick={() => inputRef.current?.click()}
          className={`card p-12 text-center cursor-pointer transition-all border-2 border-dashed ${isDragging ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)) }} />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-brand-500' : 'text-gray-300'}`} />
          <h3 className="font-semibold text-gray-700 text-lg mb-1">{isDragging ? 'Suelta los archivos aquí' : 'Arrastra tus archivos Excel'}</h3>
          <p className="text-gray-400 text-sm mb-4">o haz clic para seleccionarlos</p>
          <p className="text-xs text-gray-300">Soporta: .xlsx, .xls · Múltiples archivos</p>
        </div>

        {files.length > 0 && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Archivos ({files.length})</h3>
              <div className="flex items-center gap-3">
                {doneCount > 0 && <span className="badge-verde">{doneCount} importados</span>}
                {pendingCount > 0 && (
                  <button onClick={processAll} disabled={isProcessing} className="btn-primary">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isProcessing ? 'Procesando...' : `Importar ${pendingCount} archivo${pendingCount !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {files.map((fs, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${fs.status === 'done' ? 'bg-green-100' : fs.status === 'error' ? 'bg-red-100' : fs.status === 'processing' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                    {fs.status === 'processing' ? <Loader2 className="w-4 h-4 text-brand-600 animate-spin" /> :
                     fs.status === 'done' ? <Check className="w-4 h-4 text-green-600" /> :
                     fs.status === 'error' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                     <FileSpreadsheet className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{fs.file.name}</p>
                    <p className={`text-xs mt-0.5 ${fs.status === 'done' ? 'text-green-600' : fs.status === 'error' ? 'text-red-500' : fs.status === 'processing' ? 'text-brand-500' : 'text-gray-400'}`}>
                      {fs.status === 'pending' && `${(fs.file.size / 1024).toFixed(0)} KB · Listo`}
                      {fs.status === 'processing' && 'Procesando...'}
                      {fs.status === 'done' && fs.message}
                      {fs.status === 'error' && fs.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {fs.status === 'done' && fs.viajeId && <Link href={`/viajes/${fs.viajeId}`} className="text-xs text-brand-600">Ver viaje →</Link>}
                    {fs.status === 'pending' && <button onClick={() => processFile(i)} className="btn-secondary text-xs py-1">Importar</button>}
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-gray-300 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Viajes importados</h3>
          <div className="space-y-2">
            {viajesExistentes.map(v => (
              <Link key={v.id} href={`/viajes/${v.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 group">
                <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Bus className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 truncate">{v.nombre}</p>
                  <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </Link>
            ))}
            {viajesExistentes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin viajes aún</p>}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Hojas detectadas</h3>
          <div className="space-y-2">
            {[['ABONOS / GNP A / CANCHA B','Viajeros y pagos'],['INFORMACION / INFO','Datos personales'],['CONTACTO','Emergencias'],['HABITACIONES / ROOMLIST','Cuartos'],['LISTA DE ESPERA','En espera']].map(([n, d]) => (
              <div key={n} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                <div><p className="text-xs font-medium text-gray-700">{n}</p><p className="text-xs text-gray-400">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
