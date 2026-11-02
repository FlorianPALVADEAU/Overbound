import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { registrationBelongsToOrganization } from '@/lib/auth/organizationScope'
import { sendTicketEmail } from '@/lib/email'
import { formatWaveStartTime } from '@/lib/openSas'
import { resolveQrImageUrl } from '@/lib/qrcode/upload'
import { ResendTicketError, resendRegistrationTicket } from '@/lib/admin/resendTicket'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

/** Sends the participant their ticket e-mail again. */
const handlePost = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) return auth.response

    const parsedId = z.string().uuid().safeParse((await params).id)
    if (!parsedId.success) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

    const admin = supabaseAdmin()
    if (!(await registrationBelongsToOrganization(admin, auth.organizationId, parsedId.data))) {
      return NextResponse.json({ error: 'Inscription inaccessible' }, { status: 404 })
    }

    const result = await resendRegistrationTicket({
      admin,
      registrationId: parsedId.data,
      siteUrl: SITE_URL,
      resolveQrUrl: resolveQrImageUrl,
      formatStartTime: formatWaveStartTime,
      send: sendTicketEmail,
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ResendTicketError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin resend ticket] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, { actionType: 'Renvoi billet admin' })
