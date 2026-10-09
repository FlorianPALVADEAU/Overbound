import type { SupabaseClient } from '@supabase/supabase-js'
import { WAIVER_PLAIN_TEXT } from '@/constants/waiver'
import { formatLongDate } from '@/lib/account/format'
import { sendTransferHandedOverEmail, sendTransferReceivedEmail } from '@/lib/email'
import { redactParticipantSafetyData } from '@/lib/legal/healthData'
import type { SignedDocumentReference } from '@/lib/legal/waiverDocument'

type Admin = Pick<SupabaseClient, 'from' | 'auth'>

const PARIS_DATE_TIME = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' })

/**
 * The former holder no longer runs: their health notes and emergency contact
 * are erased. Their identity and signature stay as proof of the hand-over.
 */
export async function redactFormerHolderWaiver(admin: Pick<SupabaseClient, 'from'>, registrationId: string, now: Date) {
  const { data, error } = await admin
    .from('registration_signatures')
    .select('id, signature_data')
    .eq('registration_id', registrationId)
    .eq('context', 'purchase')
  if (error) throw error
  for (const row of data ?? []) {
    const next = row.signature_data ? redactParticipantSafetyData(row.signature_data as string, now) : null
    if (!next) continue
    const { error: updateError } = await admin.from('registration_signatures').update({ signature_data: next }).eq('id', row.id)
    if (updateError) throw updateError
  }
}

/** Both parties get a dated written trace of the hand-over; the new holder also gets the waiver they signed. */
export async function notifyTransferParties(params: {
  admin: Admin
  siteUrl: string
  event: { title: string | null; date: string | null }
  newHolder: { email: string | null | undefined; firstName: string; lastName: string }
  formerHolder: { userId: string | null; fallbackEmail: string | null }
  document: SignedDocumentReference
  now: Date
}) {
  const { admin, siteUrl, event, newHolder, formerHolder, document, now } = params
  const eventTitle = event.title ?? 'Overbound'
  const eventDate = formatLongDate(event.date) ?? ''
  const at = PARIS_DATE_TIME.format(now)
  const newHolderName = `${newHolder.firstName} ${newHolder.lastName}`.trim()

  const formerHolderEmail = formerHolder.userId
    ? ((await admin.auth.admin.getUserById(formerHolder.userId)).data.user?.email ?? formerHolder.fallbackEmail)
    : formerHolder.fallbackEmail

  const results = await Promise.allSettled([
    newHolder.email
      ? sendTransferReceivedEmail({
          to: newHolder.email,
          participantName: newHolder.firstName,
          eventTitle,
          eventDate,
          signedAt: at,
          documentVersion: document.version,
          documentSha256: document.sha256,
          waiverText: WAIVER_PLAIN_TEXT,
          accountUrl: `${siteUrl}/account`,
        })
      : Promise.resolve(null),
    formerHolderEmail && formerHolderEmail !== newHolder.email
      ? sendTransferHandedOverEmail({ to: formerHolderEmail, holderName: newHolderName, eventTitle, eventDate, claimedAt: at })
      : Promise.resolve(null),
  ])
  results.forEach((result) => {
    if (result.status === 'rejected') console.error('[claim] transfer email failed', result.reason)
  })
}
