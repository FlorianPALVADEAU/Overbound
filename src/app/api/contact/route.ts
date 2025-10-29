import { Buffer } from 'node:buffer'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendSupportContactEmail, sendSupportContactConfirmationEmail } from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'

export const runtime = 'nodejs'

const SUPPORT_INBOX = process.env.SUPPORT_INBOX ?? 'contact@overbound-race.com'
const MAX_MESSAGE_LENGTH = 4000
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']

const parseString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') ?? ''

    let fullName = ''
    let email = ''
    let reason = ''
    let message = ''
    let attachmentFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      fullName = parseString(formData.get('fullName') ?? formData.get('full_name'))
      email = parseString(formData.get('email'))
      reason = parseString(formData.get('reason'))
      message = parseString(formData.get('message'))
      const dossier = formData.get('dossier')
      if (dossier instanceof File && dossier.size > 0) {
        attachmentFile = dossier
      }
    } else {
      const payload = await request.json().catch(() => null)

      if (!payload || typeof payload !== 'object') {
        return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
      }

      fullName = parseString((payload as Record<string, unknown>).fullName)
      email = parseString((payload as Record<string, unknown>).email)
      reason = parseString((payload as Record<string, unknown>).reason)
      message = parseString((payload as Record<string, unknown>).message)
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'L’adresse email est requise.' }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: 'Le message est requis.' }, { status: 400 })
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Le message est trop long (${message.length} caractères).` },
        { status: 400 },
      )
    }

    let attachment: {
      filename: string
      content: string
      contentType: string
    } | null = null

    if (attachmentFile) {
      if (attachmentFile.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'Le fichier est trop volumineux (2 Mo maximum).' },
          { status: 400 },
        )
      }

      const extension = attachmentFile.name.split('.').pop()?.toLowerCase()
      const extensionAllowed = extension ? ALLOWED_EXTENSIONS.includes(extension) : false
      const mimeAllowed = attachmentFile.type ? ALLOWED_MIME_TYPES.includes(attachmentFile.type) : false

      if (!extensionAllowed && !mimeAllowed) {
        return NextResponse.json(
          { error: 'Format non supporté. Utilise un PDF, JPG, JPEG ou PNG.' },
          { status: 400 },
        )
      }

      const arrayBuffer = await attachmentFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      attachment = {
        filename: attachmentFile.name,
        content: buffer.toString('base64'),
        contentType:
          attachmentFile.type ||
          (extension === 'pdf' ? 'application/pdf' : extension ? `image/${extension}` : 'application/octet-stream'),
      }
    }

    const lastLog = await getLastEmailLog({
      userId: user.id,
      emailType: 'support_contact',
    })

    const todayKey = new Date().toISOString().slice(0, 10)

    if (lastLog?.sent_at) {
      const lastDate = new Date(lastLog.sent_at)
      if (!Number.isNaN(lastDate.getTime())) {
        const lastKey = lastDate.toISOString().slice(0, 10)
        if (lastKey === todayKey) {
          return NextResponse.json(
            {
              error: 'Tu as déjà soumis une demande aujourd’hui. Réponds à notre dernier e-mail ou réessaie demain.',
              retryAfterHours: 24,
            },
            { status: 429 },
          )
        }
      }
    }

    const submittedAt = new Date()
    const submittedLabel = submittedAt.toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    })

    await sendSupportContactEmail({
      to: SUPPORT_INBOX,
      requesterName: fullName,
      requesterEmail: email,
      reason: reason || undefined,
      message,
      submittedAt: submittedLabel,
      attachment,
    })

    try {
      await sendSupportContactConfirmationEmail({
        to: email,
        requesterName: fullName,
        reason: reason || undefined,
        message,
        submittedAt: submittedLabel,
      })
    } catch (confirmationError) {
      console.error('[contact] failed to send confirmation email', confirmationError)
    }

    await recordEmailLog({
      userId: user.id,
      email: user.email,
      emailType: 'support_contact',
      context: {
        reason: reason || null,
        messagePreview: message.slice(0, 240),
        submittedAt: submittedAt.toISOString(),
        attachmentName: attachment?.filename ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[contact] failed to handle contact request', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Réessaie plus tard.' }, { status: 500 })
  }
}
