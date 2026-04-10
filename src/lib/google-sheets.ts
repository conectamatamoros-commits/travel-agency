import { google } from 'googleapis'

export async function getGoogleAuth() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '')
    .replace(/\\n/g, '\n')
    .replace(/^"/, '')
    .replace(/"$/, '')

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
  return auth
}

export async function listExcelFiles() {
  const auth = await getGoogleAuth()
  const drive = google.drive({ version: 'v3', auth })
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'name',
  })

  return res.data.files ?? []
}

export async function getSheetData(fileId: string) {
  const auth = await getGoogleAuth()
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
