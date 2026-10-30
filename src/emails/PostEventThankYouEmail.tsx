import * as React from 'react'
import { Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { CtaButton, EMAIL_COLORS, Eyebrow, Paragraph, SectionTitle, Title } from './blocks'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import { getFirstName } from '@/lib/email/participantName'

interface PostEventThankYouEmailProps {
  participantName: string
  eventTitle: string
  eventId: string
  userId: string
  photosUrl?: string | null
  feedbackUrl: string
  nextEventUrl: string
}

export function PostEventThankYouEmail({
  participantName,
  eventTitle,
  eventId,
  userId,
  photosUrl,
  nextEventUrl,
}: PostEventThankYouEmailProps) {
  const ratingScale = Array.from({ length: 10 }, (_, i) => i + 1)
  const firstName = getFirstName(participantName)
  const rateUrl = (rating: number) =>
    `${getEmailAssetsBaseUrl()}/feedback/rate?userId=${userId}&eventId=${eventId}&rating=${rating}`

  return (
    <EmailLayout
      preview={`Merci d’avoir participé à ${eventTitle}. Dis-nous ce que tu en as pensé en un clic.`}
      hero={{ photo: 'P1102314', alt: 'Des participants Overbound posent ensemble à l’arrivée' }}
    >
      <Eyebrow>Merci</Eyebrow>
      <Title>{firstName ? `Merci ${firstName}` : 'Merci d’avoir été là'}</Title>
      <Paragraph>
        Merci d’avoir fait vibrer <strong>{eventTitle}</strong>. On espère que l’expérience t’a plu autant qu’à nous.
      </Paragraph>
      {photosUrl ? (
        <Paragraph>
          Les photos de l’événement sont en ligne :{' '}
          <Link href={photosUrl} style={{ color: EMAIL_COLORS.eyebrow, fontWeight: 700 }}>
            voir la galerie officielle
          </Link>
          .
        </Paragraph>
      ) : null}

      <SectionTitle>Ton avis nous aide</SectionTitle>
      <Paragraph>Sur une échelle de 1 à 10, recommanderais-tu {eventTitle} à un ami ? Clique sur ta note, c’est tout.</Paragraph>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 4px 0' }}>
        <tbody>
          <tr>
            {ratingScale.map((rating) => (
              <td key={rating} align="center" style={{ padding: '0 2px' }}>
                <Link
                  href={rateUrl(rating)}
                  style={{
                    display: 'block',
                    padding: '10px 0',
                    border: `2px solid ${EMAIL_COLORS.ink}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: EMAIL_COLORS.ink,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  {rating}
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 24px 0' }}>
        <tbody>
          <tr>
            <td style={{ fontSize: '12px', color: EMAIL_COLORS.muted }}>Pas du tout</td>
            <td align="right" style={{ fontSize: '12px', color: EMAIL_COLORS.muted }}>
              Absolument
            </td>
          </tr>
        </tbody>
      </table>

      <SectionTitle>Et la suite ?</SectionTitle>
      <Paragraph>Envie de remettre ça ? Les prochaines courses sont là.</Paragraph>
      <CtaButton href={nextEventUrl}>Voir les prochaines courses</CtaButton>
    </EmailLayout>
  )
}

export default PostEventThankYouEmail
