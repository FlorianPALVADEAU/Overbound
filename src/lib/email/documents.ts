import { sendDocumentApprovedEmail, sendDocumentRejectedEmail, sendDocumentRequiredEmail } from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

interface BaseDocumentContext {
  registrationId: string
  userId: string
  participantName?: string | null
  eventTitle: string
  email: string
}

export async function notifyDocumentRequired(params: BaseDocumentContext & { requiredDocuments: string[] }) {
  const alreadySent = await getLastEmailLog({
    userId: params.userId,
    emailType: 'document_required',
    contextFilters: { registration_id: params.registrationId },
  })

  if (alreadySent) {
    return
  }

  const uploadUrl = `${BASE_URL}/account/registration/${params.registrationId}/document`

  await sendDocumentRequiredEmail({
    to: params.email,
    participantName: params.participantName,
    eventTitle: params.eventTitle,
    uploadUrl,
    requiredDocuments: params.requiredDocuments,
  })

  await recordEmailLog({
    userId: params.userId,
    email: params.email,
    emailType: 'document_required',
    context: { registration_id: params.registrationId },
  })
}

export async function notifyDocumentApproved(params: BaseDocumentContext) {
  await sendDocumentApprovedEmail({
    to: params.email,
    participantName: params.participantName,
    eventTitle: params.eventTitle,
  })

  await recordEmailLog({
    userId: params.userId,
    email: params.email,
    emailType: 'document_approved',
    context: { registration_id: params.registrationId },
  })
}

export async function notifyDocumentRejected(params: BaseDocumentContext & { reason?: string | null }) {
  const uploadUrl = `${BASE_URL}/account/registration/${params.registrationId}/document`

  await sendDocumentRejectedEmail({
    to: params.email,
    participantName: params.participantName,
    eventTitle: params.eventTitle,
    reason: params.reason,
    uploadUrl,
  })

  await recordEmailLog({
    userId: params.userId,
    email: params.email,
    emailType: 'document_rejected',
    context: {
      registration_id: params.registrationId,
      reason: params.reason ?? null,
    },
  })
}
