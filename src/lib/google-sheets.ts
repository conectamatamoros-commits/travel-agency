import { google } from 'googleapis'

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!json) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado')
  const credentials = JSON.parse(json)
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
}

export async function listExcelFiles() {
  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })

  // Buscar TODOS los archivos compartidos con la cuenta de servicio
  const res = await drive.files.list({
    q: `(mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') and trashed=false`,
    fields: 'files(id, name, modifiedTime, mimeType)',
    orderBy: 'name',
    spaces: 'drive',
  })

  return res.data.files ?? []
}

export async function getSheetData(fileId: string) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const meta = await sheets.spreadsheets.get({ spreadsheetId: fileId })
  const sheetNames = meta.data.sheets?.map(s => s.properties?.title ?? '') ?? []

  const result: Record<string, unknown[][]> = {}
  for (const name of sheetNames) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: fileId,
      range: name,
    })
    result[name] = (res.data.values ?? []) as unknown[][]
  }

  return { sheetNames, data: result }
}
