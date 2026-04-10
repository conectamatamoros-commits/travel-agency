'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, Check, X, Loader2, AlertTriangle, Bus } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import SyncGoogleSheets from './SyncGoogleSheets'

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

const TIPO_MAP: Record<string, string> = {
  'DOBLE': 'Doble', 'TRIPLE': 'Triple',
  'CUADRUPLE': 'Cuadruple', 'INDIVIDUAL': 'Individual'
}
const TALLAS = new Set(['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL'])
const BAD_WORDS = ['TOTAL', 'DOBLE', 'TRIPLE', 'CUADRUPLE', 'INDIVIDUAL', 'TRANSPORTE',
  'KIT', 'GASTOS', 'GNP', 'CANCHA', 'VIP', 'GENERAL', 'STAY', 'VIAJERO', 'NOMBRE',
  'INFO', 'CONTACTO', 'ABONO', 'TABLAS', 'HABITACI', 'ROOMLIST', 'DADO', 'BAJA',
  'VUELOS', 'TRASLADOS', 'BOLETOS', 'NUEVO', 'COSTO', 'RESERV']

function looksLikeName(v: unknown): boolean {
  if (!v || typeof v !== 'string') return false
  const s = v.trim()
  if (s.length < 5 || !s.includes(' ')) return false
  if (/\d/.test(s)) return false
  const up = s.toUpperCase()
  return !BAD_WORDS.some(k => up.includes(k))
}

function processSheet(ws: XLSX.WorkSheet, seccion?: string): object[] {
  const viajeros: object[] = []
  if (!ws['!ref']) return viajeros
  const range = XLSX.utils.decode_range(ws['!ref'])

  for (let r = range.s.r; r <= range.e.r; r++) {
    let nombre = ''
    let nameCol = -1
    for (let c = 0; c <= Math.min(3, range.e.c); c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (cell && looksLikeName(cell.v)) {
        nombre = String(cell.v).trim()
        nameCol = c
        break
      }
    }
    if (!nombre) continue

    const nums: number[] = []
    const txts: string[] = []
    for (let c = nameCol + 1; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (!cell || cell.v == null) continue
      if (typeof cell.v === 'number' && cell.v > 0) nums.push(cell.v)
      else if (typeof cell.v === 'string' && cell.v.trim()) txts.push(cell.v.trim())
    }

    if (nums.length === 0) continue

    let tp = 0, tc = 0, sp = 0
    const ab: number[] = []
    if (nums.length >= 3) {
      sp = nums[nums.length - 1]; tc = nums[nums.length - 2]; tp = nums[nums.length - 3]
      ab.push(...nums.slice(0, nums.length - 3))
    } else if (nums.length === 2) {
      tp = nums[0]; tc = nums[1]; sp = Math.max(0, tc - tp)
    } else { tp = nums[0] }

    const tipoRaw = txts.find(s => TIPO_MAP[s.toUpperCase().replace(/Á/g, 'A')])
    const tipo = tipoRaw ? TIPO_MAP[tipoRaw.toUpperCase().replace(/Á/g, 'A')] : undefined
    const talla = txts.find(s => TALLAS.has(s.toUpperCase()))
    const celular = txts.find(s => /^\d[\d\s\-\.]{5,}$/.test(s))
    const sec = seccion ?? txts.find(s =>
      !TIPO_MAP[s.toUpperCase().replace(/Á/g, 'A')] && !TALLAS.has(s.toUpperCase()) &&
      !/^\d[\d\s\-\.]{5,}$/.test(s) && s.length > 1 && !['L', 'M', 'S', 'null'].includes(s)
    )

    viajeros.push({ nombre, talla, celular, tipo_habitacion: tipo, seccion_boleto: sec,
      total_pagado: tp, total_costo: tc, saldo_pendiente: sp, abonos: ab })
  }
  return viajeros
}

function parseExcelBuffer(buffer: ArrayBuffer, filename: string) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const nombre = filename.replace(/\.xlsx?$/i, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const SKIP = new Set(['TABLAS', 'HOJA1', 'SHEET1'])
  const INFO = new Set(['INFORMACION', 'INFO'])
  const ROOMS = new Set(['ROOMLIST', 'HABITACIONES', 'HOJA4', 'SHEET4'])
  const GENERIC = new Set(['ABONOS', 'ABONO', 'DATOS', 'SHEET2', 'HOJA2', 'HOJA3', 'SHEET3'])
  const PARENTS = new Set(['PAREJA', 'ESPOSO', 'ESPOSA', 'MADRE', 'PADRE', 'HERMANO',
    'HERMANA', 'HIJO', 'HIJA', 'AMIGO', 'AMIGA', 'ABUELO', 'ABUELA'])

  const allViajeros: object[] = []
  const infoMap = new Map<string, object>()
  const contactoMap = new Map<string, object>()
  const habitaciones: object[] = []

  for (const sname of wb.SheetNames) {
    const upper = sname.toUpperCase().trim()
    const ws = wb.Sheets[sname]
    if (!ws || !ws['!ref']) continue
    if (SKIP.has(upper)) continue

    if (upper === 'CONTACTO') {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
      for (const row of rows) {
        const txts = (row as unknown[]).map(v => String(v ?? '').trim()).filter(v => v && v !== 'null' && v.length > 2)
        if (txts.some(t => ['VIAJERO', 'NOMBRE', 'PARENTESCO', 'NUMERO'].includes(t.toUpperCase()))) continue
        const names = txts.filter(t => looksLikeName(t))
        if (!names[0]) continue
        const par = txts.find(t => PARENTS.has(t.toUpperCase()))
        const num = txts.find(t => t.replace(/\D/g, '').length >= 7)
        contactoMap.set(names[0], { nombre: names[1], parentesco: par, numero: num })
      }
      continue
    }

    if (INFO.has(upper)) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
      for (const row of rows) {
        let nombre = '', fecha: string | undefined, talla: string | undefined
        let celular: string | undefined, correo: string | undefined, descuento: string | undefined
        for (const cell of row as unknown[]) {
          if (!cell) continue
          const s = String(cell).trim()
          if (!s || s === 'null') continue
          if (s.includes('@') && !correo) { correo = s; continue }
          if (TALLAS.has(s.toUpperCase()) && !talla) { talla = s; continue }
          if (s.toLowerCase().includes('desc') && !descuento) { descuento = s; continue }
          if (/^\d{4}-\d{2}-\d{2}/.test(s) && !fecha) { fecha = s.slice(0, 10); continue }
          if (/^\d[\d\s\-\.]{5,}$/.test(s) && !celular) { celular = s; continue }
          if (looksLikeName(cell) && !nombre) { nombre = s; continue }
        }
        if (nombre) infoMap.set(nombre, { fecha_inscripcion: fecha, talla, celular, correo, descuento })
      }
      continue
    }

    if (ROOMS.has(upper)) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
      let hRow = -1
      for (let i = 0; i < rows.length; i++) {
        if ((rows[i] as unknown[]).some(v => /cuarto\s*\d*/i.test(String(v ?? '')))) { hRow = i; break }
      }
      if (hRow >= 0) {
        const headers = rows[hRow] as unknown[]
        const cols: { idx: number; nombre: string }[] = []
        headers.forEach((v, i) => { const s = String(v ?? '').trim(); if (/cuarto\s*\d*/i.test(s)) cols.push({ idx: i, nombre: s }) })
        const cuartos = new Map(cols.map(c => [c.idx, { numero_cuarto: c.nombre, tipo: undefined as string | undefined, viajeros: [] as string[] }]))
        for (let i = hRow + 1; i < rows.length; i++) {
          const row = rows[i] as unknown[]
          for (const c of cols) {
            const v = String(row[c.idx] ?? '').trim()
            if (!v || v === 'null') continue
            const d = cuartos.get(c.idx)!
            if (['DOBLE', 'TRIPLE', 'CUADRUPLE', 'INDIVIDUAL'].includes(v.toUpperCase().replace(/Á/g, 'A'))) d.tipo = v
            else if (looksLikeName(v)) d.viajeros.push(v)
          }
        }
        cuartos.forEach(d => { if (d.viajeros.length > 0 || d.tipo) habitaciones.push(d) })
      }
      continue
    }

    const sec = GENERIC.has(upper) ? undefined : sname
    const parsed = processSheet(ws, sec)
    allViajeros.push(...parsed)
  }

  const merged = new Map<string, Record<string, unknown>>()
  for (const v of allViajeros as Record<string, unknown>[]) {
    if (!v.nombre || merged.has(v.nombre as string)) continue
    const info = (infoMap.get(v.nombre as string) ?? {}) as Record<string, unknown>
    merged.set(v.nombre as string, {
      ...v, fecha_inscripcion: info.fecha_inscripcion,
      talla: info.talla ?? v.talla, celular: info.celular ?? v.celular,
      correo: info.correo, descuento: info.descuento,
      contacto: contactoMap.get(v.nombre as string),
    })
  }

  return { nombre, nombre_archivo: filename, viajeros: Array.from(merged.values()), habitaciones }
}

export default function ImportarClient({ viajesExistentes, userId }: Props) {
  const [files, setFiles] = useState<FileState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'excel' | 'google'>('excel')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => f.name.match(/\.xlsx?$/i))
    setFiles(prev => {
      const ex = new Set(prev.map(f => f.file.name))
      return [...prev, ...valid.filter(f => !ex.has(f.name)).map(f => ({ file: f, status: 'pending' as const }))]
    })
  }, [])

  const processFile = useCallback(async (index: number) => {
    setFiles(prev => {
      if (!prev[index] || prev[index].status !== 'pending') return prev
      return prev.map((f, i) => i === index ? { ...f, status: 'processing' as const } : f)
    })
    try {
      const file = files[index].file
      const buf = await file.arrayBuffer()
      const data = parseExcelBuffer(buf, file.name)
      const res = await fetch('/api/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viajeData: data, userId }),
      })
      const result = await res.json()
      if (res.ok) {
        setFiles(prev => prev.map((f, i) => i === index ? {
          ...f, status: 'done' as const,
          message: `${result.viajeros} viajeros · ${result.habitaciones} cuartos importados`,
          viajeId: result.viajeId,
        } : f))
      } else {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error' as const, message: result.error } : f))
      }
    } catch (err) {
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error' as const, message: String(err) } : f))
    }
  }, [files, userId])

  const processAll = useCallback(async () => {
    setIsProcessing(true)
    for (const idx of files.map((f, i) => f.status === 'pending' ? i : -1).filter(i => i >= 0)) {
      await processFile(idx)
    }
    setIsProcessing(false)
  }, [files, processFile])

  const pending = files.filter(f => f.status === 'pending').length
  const done = files.filter(f => f.status === 'done').length

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'excel' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📁 Importar Excel
        </button>
        <button onClick={() => setActiveTab('google')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'google' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          🔄 Google Sheets
        </button>
      </div>

      {activeTab === 'google' ? (
        <SyncGoogleSheets />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
              onClick={() => inputRef.current?.click()}
              className={`card p-12 text-center cursor-pointer border-2 border-dashed transition-all ${isDragging ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" multiple className="hidden"
                onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)) }} />
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-brand-500' : 'text-gray-300'}`} />
              <h3 className="font-semibold text-gray-700 text-lg mb-1">
                {isDragging ? 'Suelta aquí' : 'Arrastra tus archivos Excel'}
              </h3>
              <p className="text-gray-400 text-sm">o haz clic para seleccionarlos · .xlsx, .xls</p>
            </div>

            {files.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Archivos ({files.length})</h3>
                  <div className="flex gap-3 items-center">
                    {done > 0 && <span className="badge-verde">{done} importados</span>}
                    {pending > 0 && (
                      <button onClick={processAll} disabled={isProcessing} className="btn-primary">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isProcessing ? 'Procesando...' : `Importar ${pending}`}
                      </button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {files.map((fs, i) => (
                    <div key={i} className="px-5 py-4 flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${fs.status === 'done' ? 'bg-green-100' : fs.status === 'error' ? 'bg-red-100' : fs.status === 'processing' ? 'bg-brand-100' : 'bg-gray-100'}`}>
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
                          {(fs.status === 'done' || fs.status === 'error') && fs.message}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {fs.status === 'done' && fs.viajeId && (
                          <Link href={`/viajes/${fs.viajeId}`} className="text-xs text-brand-600">Ver →</Link>
                        )}
                        {fs.status === 'pending' && (
                          <button onClick={() => processFile(i)} className="btn-secondary text-xs py-1">Importar</button>
                        )}
                        <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                          className="p-1.5 text-gray-300 hover:text-red-400">
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
                      <p className="text-xs text-gray-400">
                        {new Date(v.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </Link>
                ))}
                {viajesExistentes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin viajes aún</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
