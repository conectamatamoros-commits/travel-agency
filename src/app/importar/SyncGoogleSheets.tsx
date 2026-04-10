'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, FileSpreadsheet, Check, Loader2, AlertCircle, CloudDownload } from 'lucide-react'

interface SheetFile {
  id: string
  name: string
  modifiedTime: string
}

interface SyncResult {
  fileId: string
  status: 'pending' | 'syncing' | 'done' | 'error'
  message?: string
  viajeros?: number
}

export default function SyncGoogleSheets() {
  const [files, setFiles] = useState<SheetFile[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Record<string, SyncResult>>({})
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    setLoading(true)
    try {
      const res = await fetch('/api/sync-sheets')
      const data = await res.json()
      if (data.files) setFiles(data.files)
      else setError(data.error ?? 'Error cargando archivos')
    } catch {
      setError('Error conectando con Google Drive')
    }
    setLoading(false)
  }

  async function syncFile(file: SheetFile) {
    setResults(prev => ({ ...prev, [file.id]: { fileId: file.id, status: 'syncing' } }))
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, fileName: file.name }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(prev => ({ ...prev, [file.id]: {
          fileId: file.id, status: 'done',
          message: `${data.viajeros} viajeros sincronizados`,
          viajeros: data.viajeros,
        }}))
      } else {
        setResults(prev => ({ ...prev, [file.id]: {
          fileId: file.id, status: 'error', message: data.error
        }}))
      }
    } catch (err) {
      setResults(prev => ({ ...prev, [file.id]: {
        fileId: file.id, status: 'error', message: String(err)
      }}))
    }
  }

  async function syncAll() {
    setSyncing(true)
    for (const file of files) {
      await syncFile(file)
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CloudDownload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sincronizar con Google Sheets</h3>
              <p className="text-xs text-gray-400">Importa directamente desde tu Google Drive</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadFiles} disabled={loading} className="btn-secondary text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            {files.length > 0 && (
              <button onClick={syncAll} disabled={syncing} className="btn-primary text-sm">
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                {syncing ? 'Sincronizando...' : 'Sincronizar todo'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Cargando archivos de Google Drive...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-8 text-center">
            <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No se encontraron archivos en tu carpeta de Google Drive</p>
            <p className="text-xs text-gray-400 mt-1">Asegúrate de compartir tu carpeta con la cuenta de servicio</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => {
              const result = results[file.id]
              return (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    result?.status === 'done' ? 'bg-green-100' :
                    result?.status === 'error' ? 'bg-red-100' :
                    result?.status === 'syncing' ? 'bg-blue-100' : 'bg-white'
                  }`}>
                    {result?.status === 'syncing' ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> :
                     result?.status === 'done' ? <Check className="w-4 h-4 text-green-600" /> :
                     result?.status === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                     <FileSpreadsheet className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">
                      {result?.message ?? `Modificado: ${new Date(file.modifiedTime).toLocaleDateString('es-MX')}`}
                    </p>
                  </div>
                  {(!result || result.status === 'error') && (
                    <button onClick={() => syncFile(file)} className="btn-secondary text-xs py-1.5">
                      Sincronizar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
