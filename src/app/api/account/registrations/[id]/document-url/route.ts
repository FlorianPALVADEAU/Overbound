import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: "Le dépôt de document n'est plus requis pour les inscriptions." },
    { status: 410 },
  )
}
