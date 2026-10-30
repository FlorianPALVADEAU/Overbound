import * as QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Generate QR code and upload to Supabase Storage
 * Returns public URL for use in emails
 */
export async function generateAndUploadQRCode(token: string): Promise<string> {
  try {
    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(token, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Upload to Supabase Storage
    const filename = `qr-${token}.png`
    const admin = supabaseAdmin()
    const { data, error } = await admin
      .storage
      .from('qr-codes')
      .upload(filename, qrBuffer, {
        contentType: 'image/png',
        upsert: true, // Replace if exists
        cacheControl: '31536000', // Cache for 1 year
      })

    if (error) {
      console.error('Error uploading QR code:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = admin
      .storage
      .from('qr-codes')
      .getPublicUrl(filename)

    return publicUrl
  } catch (error) {
    console.error('Error generating and uploading QR code:', error)
    throw error
  }
}

/**
 * URL of the QR code image to put in a ticket email. Prefers the stored PNG; if the upload fails,
 * falls back to the on-demand route so the ticket email still carries a QR code that Gmail can load
 * (a data: URL would not display).
 */
export async function resolveQrImageUrl(
  token: string,
  siteUrl: string,
  upload: (token: string) => Promise<string> = generateAndUploadQRCode,
): Promise<string> {
  try {
    return await upload(token)
  } catch {
    return `${siteUrl.replace(/\/$/, '')}/api/qr/${encodeURIComponent(token)}`
  }
}
