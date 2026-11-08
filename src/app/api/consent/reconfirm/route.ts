import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateReconsentToken } from '@/lib/email/unsubscribe'
import { applyConsentChoices, loadConsentChoices, type ConsentIdentity } from '@/lib/email/reconsentStore'

const postSchema = z.object({
  token: z.string().min(1),
  listIds: z.array(z.string().uuid()).max(50),
})

/** The signed token is the credential: the visitor is usually logged out. */
function identityFromToken(token: string): ConsentIdentity {
  const payload = validateReconsentToken(token)
  return { email: payload.email.trim().toLowerCase(), ...(payload.userId ? { userId: payload.userId } : {}) }
}

const invalidToken = (error: unknown) =>
  NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid token' }, { status: 400 })

/** GET /api/consent/reconfirm?token= : the lists to show, pre-checked only when the consent is traced. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  let identity: ConsentIdentity
  try {
    identity = identityFromToken(token)
  } catch (error) {
    return invalidToken(error)
  }

  try {
    return NextResponse.json({ choices: await loadConsentChoices(identity) })
  } catch (error) {
    console.error('[consent reconfirm] read error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/** POST /api/consent/reconfirm : stores the person's answer, list by list. */
export async function POST(request: NextRequest) {
  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  let identity: ConsentIdentity
  try {
    identity = identityFromToken(parsed.data.token)
  } catch (error) {
    return invalidToken(error)
  }

  try {
    const { accepted } = await applyConsentChoices(identity, parsed.data.listIds)
    return NextResponse.json({ success: true, accepted })
  } catch (error) {
    console.error('[consent reconfirm] write error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
