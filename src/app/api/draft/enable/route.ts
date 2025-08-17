import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const redirect = searchParams.get('redirect') || '/'
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) return new NextResponse('Invalid secret', { status: 401 })
  ;(await draftMode()).enable()
  return NextResponse.redirect(new URL(redirect, request.url))
}