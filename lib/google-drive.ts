import { google } from 'googleapis'
import { Readable } from 'stream'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

function getAuthClient() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    SCOPES
  )
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuthClient() })
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const drive = getDrive()
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id',
  })

  if (!res.data.id) {
    throw new Error('Drive upload failed: no file ID returned')
  }

  return res.data.id
}

export async function getFileBuffer(
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const drive = getDrive()

  const meta = await drive.files.get({ fileId, fields: 'mimeType' })
  const mimeType = meta.data.mimeType || 'application/octet-stream'

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )

  return {
    buffer: Buffer.from(res.data as ArrayBuffer),
    mimeType,
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDrive()
  await drive.files.delete({ fileId })
}
