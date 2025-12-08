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
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

export const runtime = 'nodejs'

const SITE_URL = getEmailAssetsBaseUrl()
const ACCOUNT_URL = `${SITE_URL}/account`
const EVENTS_URL = `${SITE_URL}/events`
const BLOG_URL = `${SITE_URL}/blog`
const ADMIN_LOGS_URL = `${SITE_URL}/admin?tab=logs`

const SAMPLE_QR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATiSURBVO3BQY4bSRAEwfAC//9lXx3zVECjkzNaIczwj1QtOaladFK16KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhZ98hKQn6TmBsgTaiYgk5oJyKTmm4D8JDVvnFQtOqladFK16JNlajYB2aTmCSBPALlR84aaTUA2nVQtOqladFK16JMvA/KEmieATGomIBOQSc2NmgnIG0Bu1DwB5Ak133RSteikatFJ1aJP/nFqboBMaiYgN0AmNU8A+ZecVC06qVp0UrXok38MkE1qJiCTmieATGr+JSdVi06qFp1ULfrky9T8JjUTkEnNG0Bu1ExqNqn5m5xULTqpWnRSteiTZUB+k5oJyKRmAjKpmYBMaiYgk5oJyKRmAjKpuQHyNzupWnRSteikatEnL6n5mwCZ1HyTmieAPKHm/+SkatFJ1aKTqkWfvARkUjMB2aRmUvMEkCfUTEBu1NyoeQLIJjXfdFK16KRq0UnVok+WAZnUTECeUDMBmdRsAnKj5gk1TwC5UTMBuVEzAZnUbDqpWnRSteikatEnP0zNBOQGyKRmAvKEmgnIE0CeUHMD5EbNBGRScwPkJ51ULTqpWnRStQj/yAtAJjVvAJnUPAFkUjMBmdRMQCY1bwC5UTMBuVEzAblRMwG5UfPGSdWik6pFJ1WLPvllQCY1E5AbNZOaCcgNkEnNBORGzQRkUnMDZFIzAblR84aaTSdVi06qFp1ULfrky4BMaiY1E5BJzQTkCTU3QG7U3ACZ1ExAJjWTmhs1E5An1Pykk6pFJ1WLTqoWffKSmhs1E5BJzaRmAjKpeQPIpOYJIJOaCcgbQCY1N2pugExqvumkatFJ1aKTqkX4R14AcqNmE5AbNTdAbtRMQCY1E5BJzQ2QGzUTkEnNBORGzU86qVp0UrXopGrRJ8vU3ACZ1ExA3gAyqZnUPKFmAjKpmYDcqJmA3Kh5Qs1vOqladFK16KRqEf6RF4DcqPlNQCY1N0Bu1DwBZFIzAblR839yUrXopGrRSdWiT5apuQFyo2YC8oSaGyBvAJnUTEBugExqngAyqZmAPKFm00nVopOqRSdViz75y6m5ATIBmdTcALlRcwNkUnMD5AbIjZoJyI2aGyCTmjdOqhadVC06qVr0yQ9T8wSQGzUTkBsgN2omIE8AuVEzAXkCyBtAJjWbTqoWnVQtOqlahH/kfwzIpOYGyI2aGyCTmieA3Kh5Asik5gkgk5o3TqoWnVQtOqla9MlLQH6SmknNBOQJNW8AuVEzqZmA3ACZ1NwAeULNppOqRSdVi06qFn2yTM0mIDdAJjUTkEnNBGRSMwGZ1DwBZFLzhJon1Pymk6pFJ1WLTqoWffJlQJ5Qs0nNG2omIJOaTUC+CcikZtNJ1aKTqkUnVYs+qSsgN0AmNZOaJ9TcAPmbnVQtOqladFK16JN/DJBJzY2aGzUTkEnNBOQJNROQGzUTkBsgP+mkatFJ1aKTqkWffJmab1JzA2RSMwGZ1NyomYBMam6ATEBu1NyomYDcqPmmk6pFJ1WLTqoWfbIMyE8C8gSQGyCTmgnIDZBJzY2aGyBvqJmATGo2nVQtOqladFK1CP9I1ZKTqkUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFJ1WLTqoWnVQtOqladFK16KRq0X9aSko0AxfyTgAAAABJRU5ErkJggg=='

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
          eventTitle: 'Ultra Arena',
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
          eventTitle: 'Horizon',
          eventId: 'ec2b4789-0081-4754-8539-1fcfd191092e',
          userId: user.id,
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
          eventTitle: 'Ultra Arena',
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
          userId: user.id,
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
          userId: user.id,
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
          userId: user.id,
          title: 'Offre spéciale OverBound',
          message: 'Bénéficie de -20% sur ta prochaine inscription avec le code ci-dessous.',
          ctaLabel: 'Voir les événements',
          ctaUrl: EVENTS_URL,
          promoCode: 'OB-WELCOME20',
          promoDetails: "Valable jusqu'au 30 juin sur tous les formats OverBound.",
        })
        return 'Email promo envoyé.'
      },
      reactivation_inactive: async () => {
        await sendInactiveUserEmail({
          to: user.email!,
          fullName,
          userId: user.id,
          lastEventTitle: 'OverBound Grenoble 2024',
          eventsUrl: EVENTS_URL,
          highlightEventTitle: 'Ultra Arena',
          highlightEventUrl: `${EVENTS_URL}/ultra-arena`,
        })
        return 'Relance inactifs envoyée.'
      },
      reactivation_abandoned_checkout: async () => {
        await sendAbandonedCheckoutEmail({
          to: user.email!,
          fullName,
          eventTitle: 'Horizon',
          ticketName: 'Format Expérience 8 km',
          resumeUrl: `${EVENTS_URL}/horizon/register`,
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
            title: 'OverBound Lyon',
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
          contactPhone: '+33 6 XX XX XX XX',
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
