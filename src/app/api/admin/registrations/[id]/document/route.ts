import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: "La consultation des documents d'inscription n'est plus active." },
    { status: 410 },
  )
}
