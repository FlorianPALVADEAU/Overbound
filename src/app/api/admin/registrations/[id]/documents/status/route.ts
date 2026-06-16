import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: "La validation manuelle des documents n'est plus active." },
    { status: 410 },
  )
}
