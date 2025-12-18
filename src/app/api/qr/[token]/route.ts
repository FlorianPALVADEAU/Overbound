import { NextRequest, NextResponse } from 'next/server'
import * as QRCode from 'qrcode'

export const runtime = 'nodejs'

/**
 * API endpoint to generate QR codes dynamically
 * This ensures QR codes work in emails (data URLs don't work in most email clients)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || typeof token !== 'string') {
      return new NextResponse('Invalid token', { status: 400 })
    }

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(token, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Return image with proper headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(qrBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[qr generation] Error:', error)
    return new NextResponse('Error generating QR code', { status: 500 })
  }
}
