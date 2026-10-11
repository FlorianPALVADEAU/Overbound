import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { createDeletionRequest } from '@/lib/account/deletionRequest'
import { sendDeletionRequestEmails } from '@/lib/account/deletionEmail'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const user = await resolveRequestUser(request)
    if (!user?.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const result = await createDeletionRequest(supabaseAdmin(), { id: user.id, email: user.email })

    if (result === 'created') {
      await sendDeletionRequestEmails({ id: user.id, email: user.email }).catch((error) => {
        console.error('[deletion request] email error', error)
      })
    }

    return NextResponse.json({ success: true, status: result })
  } catch (error) {
    console.error('[deletion request] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
