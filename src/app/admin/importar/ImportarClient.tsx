'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, Check, X, Loader2, AlertTriangle, Bus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface FileState {
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  message?: string
  viajeroCount?: number
  viajeId?: string
}

interface Props {
  viajesExistentes: { id: string; nombre: string; created_at: string }[]
  userId: string
}

export default function ImportarClient({ viajesExistentes, userId }: Props) {
  const [files, setFiles] = useState<FileState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: File[]) {
    const xlsxFiles = newFiles.filter(f => f.name.match(/\.xlsx?$/i))
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.file.name))
      const toAdd = xlsxFiles.filter(f => !existingNames.has(f.name))
      return [...prev, ...toAdd.map(f => ({ file: f, status: 'pending' as const }))]
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files))
  }

  async function processFile(index: number) {
    const fileState = files[index]
    if (!fileState || fileState.status !== 'pending') return

    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'processing' } : f))

    try {
      const formData = new FormData()
      formData.append('file', fileState.file)
      formData.append('userId', userId)

      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok) {
        setFiles(prev => prev.map((f, i) => i === index ? {
          ...f, status: 'done',
          message: `${data.viajeros} viajeros · ${data.habitaciones} cuartos importados`,
          viajeroCount: data.viajeros,
          viajeId: data.viajeId,
        } : f))
      } else {
        setFiles(prev => prev.map((f, i) => i === index ? {
          ...f, status: 'error', message: data.error ?? 'Error al procesar'
        } : f))
      }
    } catch (err) {
      setFiles(prev => prev.map((f, i) => i === index ? {
        ...f, status: 'error', message: 'Error de red'
      } : f))
    }
  }

  async function processAll() {
    setIsProcessing(true)
    const pendingIndexes = files.map((f, i) => f.status === 'pending' ? i : -1).filter(i => i >= 0)
    for (const idx of pendingIndexes) {
      await processFile(idx)
    }
    setIsProcessing(false)
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const doneCount = files.filter(f => f.status === 'done').length

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`card p-12 text-center cursor-pointer transition-all border-2 border-dashed ${isDragging ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls" multiple className="hidden" onChange={onInputChange} />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-brand-500' : 'text-gray-300'}`} />
          <h3 className="font-semibold text-gray-700 text-lg mb-1">
            {isDragging ? 'Suelta los archivos aquí' : 'Arrastra tus archivos Excel'}
          </h3>
          <p className="text-gray-400 text-sm mb-4">o haz clic para seleccionarlos</p>
          <p className="text-xs text-gray-300">Soporta: .xlsx, .xls · Puedes subir múltiples archivos</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Archivos ({files.length})</h3>
              <div className="flex items-center gap-3">
                {doneCount > 0 && (
                  <span className="badge-verde">{doneCount} importados</span>
                )}
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
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    fs.status === 'done' ? 'bg-green-100' :
                    fs.status === 'error' ? 'bg-red-100' :
                    fs.status === 'processing' ? 'bg-brand-100' : 'bg-gray-100'
                  }`}>
                    {fs.status === 'processing' ? <Loader2 className="w-4 h-4 text-brand-600 animate-spin" /> :
                     fs.status === 'done' ? <Check className="w-4 h-4 text-green-600" /> :
                     fs.status === 'error' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                     <FileSpreadsheet className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{fs.file.name}</p>
                    <p className={`text-xs mt-0.5 ${
                      fs.status === 'done' ? 'text-green-600' :
                      fs.status === 'error' ? 'text-red-500' :
                      fs.status === 'processing' ? 'text-brand-500' : 'text-gray-400'
                    }`}>
                      {fs.status === 'pending' && `${(fs.file.size / 1024).toFixed(0)} KB · Listo para importar`}
                      {fs.status === 'processing' && 'Procesando...'}
                      {fs.status === 'done' && (fs.message ?? 'Importado correctamente')}
                      {fs.status === 'error' && (fs.message ?? 'Error')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {fs.status === 'done' && fs.viajeId && (
                      <Link href={`/viajes/${fs.viajeId}`} className="text-xs text-brand-600 hover:underline">
                        Ver viaje →
                      </Link>
                    )}
                    {fs.status === 'pending' && (
                      <button onClick={() => processFile(i)} className="btn-secondary text-xs py-1">
                        Importar
                      </button>
                    )}
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">¿Cómo funciona?</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Arrastra o selecciona tus archivos Excel de viajes (.xlsx)', color: 'bg-brand-100 text-brand-700' },
              { step: '2', text: 'El sistema detecta automáticamente viajeros, pagos, cuartos y listas de espera', color: 'bg-brand-100 text-brand-700' },
              { step: '3', text: 'Haz clic en "Importar" y los datos quedan listos en segundos', color: 'bg-brand-100 text-brand-700' },
              { step: '4', text: 'Puedes importar varios archivos simultáneamente', color: 'bg-brand-100 text-brand-700' },
            ].map(({ step, text, color }) => (
              <div key={step} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center flex-shrink-0 text-xs font-bold`}>{step}</div>
                <p className="text-sm text-gray-600 pt-0.5">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Si el viaje ya existe, la importación actualizará los datos existentes en lugar de duplicarlos.</p>
          </div>
        </div>
      </div>

      {/* Right panel - Recent imports */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Viajes importados</h3>
          <div className="space-y-2">
            {viajesExistentes.map(v => (
              <Link key={v.id} href={`/viajes/${v.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 group">
                <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
            {viajesExistentes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sin viajes importados aún</p>
            )}
          </div>
        </div>

        {/* Format guide */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Hojas detectadas</h3>
          <div className="space-y-2">
            {[
              { nombre: 'TABLAS / Hoja1', desc: 'Precios por tipo de habitación' },
              { nombre: 'ABONOS / DATOS', desc: 'Viajeros y sus pagos' },
              { nombre: 'INFORMACION / INFO', desc: 'Datos personales y tallas' },
              { nombre: 'CONTACTO', desc: 'Contactos de emergencia' },
              { nombre: 'HABITACIONES / ROOMLIST', desc: 'Asignación de cuartos' },
              { nombre: 'LISTA DE ESPERA', desc: 'Personas en espera' },
            ].map(({ nombre, desc }) => (
              <div key={nombre} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-700">{nombre}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
