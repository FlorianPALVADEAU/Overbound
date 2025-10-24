import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import {
  sendOnboardingEmail,
  sendProfileCompletionReminderEmail,
  sendEventPrepEmail,
  sendPostEventThankYouEmail,
  sendDocumentRequiredEmail,
  sendDocumentApprovedEmail,
  sendDocumentRejectedEmail,
  sendTicketEmail,
  sendNewEventAnnouncementEmail,
  sendPriceChangeReminderEmail,
  sendPromoCampaignEmail,
  sendInactiveUserEmail,
  sendAbandonedCheckoutEmail,
  sendEventUpdateEmail,
  sendAdminDigestEmail,
  sendVolunteerRecruitmentEmail,
  sendVolunteerAssignmentEmail,
} from '@/lib/email'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'
const ACCOUNT_URL = `${SITE_URL}/account`
const EVENTS_URL = `${SITE_URL}/events`
const BLOG_URL = `${SITE_URL}/blog`
const ADMIN_LOGS_URL = `${SITE_URL}/admin?tab=logs`

const SAMPLE_QR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8/5+hHgAH+wLBffJm8wAAAABJRU5ErkJggg=='

const handlePost = async (request: NextRequest) => {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, phone, date_of_birth, marketing_opt_in')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const payload = await request.json().catch(() => ({}))
    const type = typeof payload?.type === 'string' ? payload.type : ''

    if (!type) {
      return NextResponse.json({ error: 'Type d’email manquant.' }, { status: 400 })
    }

    const fullName = profile.full_name ?? user.user_metadata?.full_name ?? user.email

    const handlers: Record<string, () => Promise<string>> = {
      onboarding: async () => {
        await sendOnboardingEmail({
          to: user.email!,
          fullName,
          accountUrl: ACCOUNT_URL,
          eventsUrl: EVENTS_URL,
          blogUrl: BLOG_URL,
        })
        return 'Email onboarding envoyé.'
      },
      profile_nudge: async () => {
        await sendProfileCompletionReminderEmail({
          to: user.email!,
          fullName,
          accountUrl: ACCOUNT_URL,
          missingFields: ['Téléphone', 'Date de naissance'],
        })
        return 'Rappel profil incomplet envoyé.'
      },
      event_prep: async () => {
        await sendEventPrepEmail({
          to: user.email!,
          participantName: fullName ?? 'Athlète',
          eventTitle: 'Tribal Royale',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          eventLocation: 'Parc de Miribel-Jonage',
          weeksRemaining: 2,
          checklist: [
            'Vérifie ton équipement et ton QR code dans ton compte.',
            'Planifie ton covoiturage.',
            'Hydrate-toi régulièrement cette semaine.',
          ],
          trainingUrl: `${SITE_URL}/blog`,
        })
        return 'Email de préparation envoyé.'
      },
      post_event: async () => {
        await sendPostEventThankYouEmail({
          to: user.email!,
          participantName: fullName ?? 'Athlète',
          eventTitle: 'La Voie du Héros',
          feedbackUrl: `${SITE_URL}/feedback/form`,
          nextEventUrl: EVENTS_URL,
          photosUrl: `${SITE_URL}/blog/photos`,
        })
        return 'Email de remerciement envoyé.'
      },
      document_required: async () => {
        await sendDocumentRequiredEmail({
          to: user.email!,
          participantName: fullName ?? 'Athlète',
          eventTitle: 'OverBound Lyon 2025',
          uploadUrl: `${ACCOUNT_URL}/registration/sample/document`,
          requiredDocuments: ['Certificat médical de moins de 1 an'],
        })
        return 'Demande de document envoyée.'
      },
      document_approved: async () => {
        await sendDocumentApprovedEmail({
          to: user.email!,
          participantName: fullName ?? null,
          eventTitle: 'OverBound Lyon 2025',
        })
        return 'Confirmation document validé envoyée.'
      },
      document_rejected: async () => {
        await sendDocumentRejectedEmail({
          to: user.email!,
          participantName: fullName ?? null,
          eventTitle: 'OverBound Lyon 2025',
          reason: 'Le document fourni est illisible. Merci de renvoyer une version scannée.',
          uploadUrl: `${ACCOUNT_URL}/registration/sample/document`,
        })
        return 'Notification document rejeté envoyée.'
      },
      ticket_confirmation: async () => {
        await sendTicketEmail({
          to: user.email!,
          participantName: fullName ?? 'Athlète',
          eventTitle: 'Tribal Royale',
          eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          eventLocation: 'Lac de Vassivière',
          ticketName: 'Format Élite 12 km',
          qrUrl: SAMPLE_QR,
          manageUrl: `${ACCOUNT_URL}/tickets`,
        })
        return 'Billet de démonstration envoyé.'
      },
      marketing_new_event: async () => {
        await sendNewEventAnnouncementEmail({
          to: user.email!,
          fullName,
          eventTitle: 'Night Run Paris',
          eventDate: 'Vendredi 12 septembre',
          eventLocation: 'Paris — Bois de Boulogne',
          eventUrl: `${EVENTS_URL}/night-run`,
          highlight: 'Format nocturne inédit + obstacles lumineux.',
        })
        return 'Annonce nouvel événement envoyée.'
      },
      marketing_price_change: async () => {
        await sendPriceChangeReminderEmail({
          to: user.email!,
          fullName,
          eventTitle: 'OverBound Marseille',
          eventDate: 'Samedi 4 octobre',
          deadlineLabel: 'demain à 23h59',
          eventUrl: `${EVENTS_URL}/overbound-marseille`,
          currentPriceLabel: '49,00 €',
          nextPriceLabel: '59,00 €',
        })
        return 'Rappel changement de prix envoyé.'
      },
      marketing_promo: async () => {
        await sendPromoCampaignEmail({
          to: user.email!,
          fullName,
          title: 'Offre spéciale OverBound',
          message: 'Bénéficie de -20% sur ta prochaine inscription avec le code ci-dessous.',
          ctaLabel: 'Voir les événements',
          ctaUrl: EVENTS_URL,
          promoCode: 'OB-WELCOME20',
          promoDetails: 'Valable jusqu’au 30 juin sur tous les formats OverBound.',
        })
        return 'Email promo envoyé.'
      },
      reactivation_inactive: async () => {
        await sendInactiveUserEmail({
          to: user.email!,
          fullName,
          lastEventTitle: 'OverBound Grenoble 2024',
          eventsUrl: EVENTS_URL,
          highlightEventTitle: 'Tribal Royale',
          highlightEventUrl: `${EVENTS_URL}/tribal-royale`,
        })
        return 'Relance inactifs envoyée.'
      },
      reactivation_abandoned_checkout: async () => {
        await sendAbandonedCheckoutEmail({
          to: user.email!,
          fullName,
          eventTitle: 'La Voie du Héros',
          ticketName: 'Format Expérience 8 km',
          resumeUrl: `${EVENTS_URL}/voie-du-heros/register`,
          incentive: 'Rappelle-toi : ton panier est toujours réservé pendant 48h.',
        })
        return 'Relance checkout envoyée.'
      },
      event_update: async () => {
        await sendEventUpdateEmail({
          to: user.email!,
          participantName: fullName ?? 'Athlète',
          eventTitle: 'OverBound Alpes',
          previousDate: 'Samedi 18 octobre 2025, 09:00',
          newDate: 'Dimanche 19 octobre 2025, 09:00',
          previousLocation: 'Grenoble',
          newLocation: 'Autrans — Vercors',
          statusMessage: 'Le lieu a été ajusté pour offrir un parcours encore plus spectaculaire.',
          manageUrl: `${ACCOUNT_URL}/tickets`,
        })
        return 'Notification mise à jour événement envoyée.'
      },
      admin_digest: async () => {
        const now = new Date()
        await sendAdminDigestEmail({
          to: user.email!,
          periodLabel: `${new Date(now.getTime() - 60 * 60 * 1000).toLocaleString('fr-FR')} → ${now.toLocaleString('fr-FR')}`,
          totalActions: 3,
          totalErrors: 1,
          logsUrl: ADMIN_LOGS_URL,
          items: [
            {
              timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
              summary: 'Création événement admin',
              statusCode: 200,
              userEmail: user.email,
              actionType: 'Création événement admin',
              path: '/api/admin/events',
              durationMs: 285,
            },
            {
              timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
              summary: 'Erreur import documents',
              statusCode: 500,
              userEmail: user.email,
              actionType: 'Upload document admin',
              path: '/api/admin/documents',
              durationMs: 412,
            },
            {
              timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
              summary: 'Mise à jour ticket',
              statusCode: 200,
              userEmail: user.email,
              actionType: 'Mise à jour ticket',
              path: '/api/admin/tickets',
              durationMs: 180,
            },
          ],
        })
        return 'Digest admin envoyé.'
      },
      volunteer_recruitment: async () => {
        const baseDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        await sendVolunteerRecruitmentEmail({
          to: user.email!,
          fullName,
          headlineEvent: {
            id: 'evt_headline',
            title: 'Check-in OverBound Lyon',
            date: baseDate.toISOString(),
            location: 'Lyon — Parc de Gerland',
            checkinWindow: '07:00 → 09:30',
          },
          otherEvents: [
            {
              id: 'evt_1',
              title: 'Night Run Paris',
              date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'Paris — Bois de Boulogne',
              checkinWindow: '18:00 → 21:00',
            },
            {
              id: 'evt_2',
              title: 'Tribal Kids',
              date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'Annecy — Base nautique',
              checkinWindow: '08:30 → 12:00',
            },
          ],
          callToActionUrl: `${SITE_URL}/volunteers`,
        })
        return 'Digest bénévoles envoyé.'
      },
      volunteer_assignment: async () => {
        await sendVolunteerAssignmentEmail({
          to: user.email!,
          fullName,
          eventTitle: 'OverBound Lyon',
          eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          eventLocation: 'Parc de Gerland',
          shiftStart: '07:00',
          shiftEnd: '11:30',
          arrivalInstructions: 'Rendez-vous à la tente bénévoles pour récupérer ton badge et ton t-shirt.',
          contactEmail: 'orga@overbound.com',
          contactPhone: '+33 6 12 34 56 78',
          checkinUrl: `${SITE_URL}/admin/checkin?event=demo`,
        })
        return 'Brief bénévole envoyé.'
      },
    }

    const handler = handlers[type]

    if (!handler) {
      return NextResponse.json({ error: `Type d’email inconnu : ${type}` }, { status: 400 })
    }

    const message = await handler()

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('[admin email trigger] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Envoi email test admin',
})
