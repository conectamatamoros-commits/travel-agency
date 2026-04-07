import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'no file' })

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array', raw: true })
    
    const result: Record<string, unknown> = { sheets: wb.SheetNames, data: {} }

    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as unknown[][]
      const sample = rows.filter(r => Array.isArray(r) && r.some(v => v !== null)).slice(0, 3)
      ;(result.data as Record<string, unknown>)[name] = sample
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
