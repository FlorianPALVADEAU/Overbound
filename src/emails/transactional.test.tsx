import { describe, expect, it } from 'vitest'
import type { ReactElement } from 'react'
import { renderEmail } from '@/lib/email/render'
import BootcampRegistrationEmail from './BootcampRegistrationEmail'
import { EventPrepEmail } from './EventPrepEmail'
import { EventUpdateEmail } from './EventUpdateEmail'
import { LuckyWheelReminderEmail } from './LuckyWheelReminderEmail'
import { LuckyWheelRewardEmail } from './LuckyWheelRewardEmail'
import { OnboardingEmail } from './OnboardingEmail'
import { PopupSubscribeConfirmationEmail } from './PopupSubscribeConfirmationEmail'
import { PostEventThankYouEmail } from './PostEventThankYouEmail'
import ReceiptEmail from './ReceiptEmail'
import { SupportContactConfirmationEmail } from './SupportContactConfirmationEmail'
import TicketEmail from './TicketEmail'
import { FlexibleRefundEmail } from './TicketRefundEmail'
import { TransferHandedOverEmail, TransferReceivedEmail } from './TicketTransferEmail'
import { VolunteerApplicationConfirmationEmail } from './VolunteerApplicationConfirmationEmail'
import VolunteerAssignmentEmail from './VolunteerAssignmentEmail'
import VolunteerRecruitmentEmail from './VolunteerRecruitmentEmail'
import { B2bQuoteConfirmationEmail } from './B2bQuoteConfirmationEmail'

const emails: Record<string, () => ReactElement> = {
  ticket: () =>
    TicketEmail({
      participantName: 'Alex Runner',
      eventTitle: 'Overbound Race',
      eventDate: 'samedi 24 avril 2027',
      eventLocation: 'Trappes',
      ticketName: 'Primal OPEN',
      qrUrl: 'https://cdn.example/qr.png',
      manageUrl: 'https://overbound-race.com/account/tickets',
    }),
  receipt: () =>
    ReceiptEmail({
      invoiceNumber: 'OB-1',
      invoiceDate: '30 octobre 2026',
      eventName: 'Overbound Race',
      items: [{ description: 'Primal OPEN', quantity: 1, unitPrice: 45, total: 45 }],
      subtotal: 45,
      total: 45,
      paymentMethod: 'Carte bancaire',
    }),
  refund: () => FlexibleRefundEmail({ eventTitle: 'Overbound Race', eventDate: '24 avril 2027', amountLabel: '45,00 €', cancelledAt: '1 novembre 2026' }),
  transferReceived: () =>
    TransferReceivedEmail({
      participantName: 'Sam Roche',
      eventTitle: 'Overbound Race',
      eventDate: '24 avril 2027',
      signedAt: '1 novembre 2026',
      documentVersion: '2026-10',
      documentSha256: 'abc',
      waiverText: 'Texte de la décharge',
      accountUrl: 'https://overbound-race.com/account/tickets',
    }),
  transferHandedOver: () =>
    TransferHandedOverEmail({ holderName: 'Sam Roche', eventTitle: 'Overbound Race', eventDate: '24 avril 2027', claimedAt: '1 novembre 2026' }),
  bootcamp: () =>
    BootcampRegistrationEmail({ fullName: 'Alex Runner', bootcampTitle: 'Bootcamp 1', startsAt: '2026-11-15T09:00:00Z', locationName: 'Parc', locationAddress: '1 rue du Parc' }),
  volunteerConfirmation: () =>
    VolunteerApplicationConfirmationEmail({ applicantName: 'Alex Runner', preferredMission: 'Accueil', submittedAt: '1 novembre 2026' }),
  volunteerRecruitment: () =>
    VolunteerRecruitmentEmail({
      fullName: 'Alex Runner',
      headlineEvent: { id: 'e1', title: 'Overbound Race', date: '2027-04-24T08:00:00Z', location: 'Trappes', checkinWindow: '7h à 8h' },
      callToActionUrl: 'https://overbound-race.com/volunteers',
    }),
  volunteerAssignment: () => VolunteerAssignmentEmail({ fullName: 'Alex Runner', eventTitle: 'Overbound Race', role: 'Accueil', shiftStart: '7h', shiftEnd: '12h' }),
  supportConfirmation: () =>
    SupportContactConfirmationEmail({ fullName: 'Alex Runner', reason: 'Billet', message: 'Bonjour', submittedAt: '1 novembre 2026' }),
  b2b: () => B2bQuoteConfirmationEmail({ contactName: 'Claire Martin', companyName: 'Acme', teamSizeLabel: '10-19', projectTypeLabel: 'Billets' }),
  popup: () => PopupSubscribeConfirmationEmail({ eventsUrl: 'https://overbound-race.com/events', blogUrl: 'https://overbound-race.com/blog' }),
  wheelReward: () => LuckyWheelRewardEmail({ rewardName: '-10 %', promoCode: 'WHEEL10', expiresAtLabel: '15 novembre', registerUrl: 'https://overbound-race.com' }),
  wheelReminder: () => LuckyWheelReminderEmail({ rewardName: '-10 %', expiresAtLabel: '15 novembre', registerUrl: 'https://overbound-race.com', isLastChance: true }),
  prep: () =>
    EventPrepEmail({ participantName: 'Alex Runner', eventTitle: 'Overbound Race', eventDate: '24 avril 2027', eventLocation: 'Trappes', weeksRemaining: 4, checklist: ['Dormir'], trainingUrl: 'https://overbound-race.com/blog' }),
  update: () =>
    EventUpdateEmail({ eventTitle: 'Overbound Race', previousDate: '24 avril', newDate: '1 mai', statusMessage: 'Report', manageUrl: 'https://overbound-race.com/account' }),
  thanks: () =>
    PostEventThankYouEmail({ participantName: 'Alex Runner', eventTitle: 'Overbound Race', eventId: 'e1', userId: 'u1', feedbackUrl: 'x', nextEventUrl: 'https://overbound-race.com/events' }),
  onboarding: () => OnboardingEmail({ accountUrl: 'https://overbound-race.com/account', eventsUrl: 'https://overbound-race.com/events', blogUrl: 'https://overbound-race.com/blog' }),
}

describe.each(Object.entries(emails))('transactional email %s', (_name, build) => {
  it('renders a light, branded email without banned typography or decoration', async () => {
    const html = await renderEmail(build())

    expect(html).toContain('totem_logo_white.png')
    expect(html).toContain('lang="fr"')
    expect(html).not.toContain(String.fromCharCode(0x2013))
    expect(html).not.toMatch(/border-left/i)
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
  })
})
