import * as React from 'react'
import { Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { Checklist, CtaButton, EMAIL_COLORS, Eyebrow, Highlight, Paragraph, SectionTitle, SmallPrint, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'

interface PopupSubscribeConfirmationEmailProps {
  fullName?: string | null
  userId?: string
  eventsUrl: string
  blogUrl: string
}

export function PopupSubscribeConfirmationEmail({ fullName, eventsUrl, blogUrl }: PopupSubscribeConfirmationEmailProps) {
  const firstName = getFirstName(fullName)
  return (
    <EmailLayout
      preview="Bienvenue chez Overbound : ton code cumulable WELCOME05 est dans cet email."
      hero={{ photo: 'chain-carry3', alt: 'Un participant porte des chaînes sur le parcours Overbound' }}
    >
      <Eyebrow>Inscription à la newsletter</Eyebrow>
      <Title>{firstName ? `Bienvenue ${firstName}` : 'Bienvenue chez Overbound'}</Title>
      <Paragraph>
        Merci de t’être inscrit·e à notre newsletter. Pour te souhaiter la bienvenue, voici un code de réduction{' '}
        <strong>cumulable</strong> à saisir au moment de ton inscription à une course :
      </Paragraph>

      <Highlight label="Ton code">WELCOME05</Highlight>

      <CtaButton href={eventsUrl}>Voir les prochaines courses</CtaButton>

      <SectionTitle>Ce que tu vas recevoir</SectionTitle>
      <Checklist
        items={[
          'Les nouveaux événements, dès leur annonce',
          'Les changements de prix, pour ne pas rater les meilleurs tarifs',
          'Des offres de nos partenaires',
          'Des conseils d’entraînement et des articles du blog',
          'Les appels à bénévoles',
        ]}
      />

      <SmallPrint>
        Envie de t’entraîner dès maintenant ? Lis nos{' '}
        <Link href={blogUrl} style={{ color: EMAIL_COLORS.eyebrow }}>
          articles du blog
        </Link>
        . Tu peux te désinscrire à tout moment avec le lien en bas de nos emails.
      </SmallPrint>
    </EmailLayout>
  )
}

export default PopupSubscribeConfirmationEmail
