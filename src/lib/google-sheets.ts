// src/lib/google-sheets.ts
import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
]

export async function getGoogleAuth() {
  const auth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  })
  return auth
}

export async function getSpreadsheet(spreadsheetId: string) {
  const auth = await getGoogleAuth()
  const doc = new GoogleSpreadsheet(spreadsheetId, auth)
  await doc.loadInfo()
  return doc
}

export async function listExcelFiles() {
  const auth = await getGoogleAuth()
  const { google } = await import('googleapis')
  const drive = google.drive({ version: 'v3', auth })
  
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'name',
  })
  
  return res.data.files ?? []
}
