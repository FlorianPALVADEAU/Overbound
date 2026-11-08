import * as React from 'react'
import EmailLayout from './EmailLayout'
import { CtaButton, Eyebrow, Paragraph, SectionTitle, Steps, Title } from './blocks'

interface OnboardingEmailProps {
  firstName?: string | null
  accountUrl: string
  eventsUrl: string
  blogUrl: string
}

export function OnboardingEmail({ firstName, accountUrl, eventsUrl, blogUrl }: OnboardingEmailProps) {
  return (
    <EmailLayout
      preview="Ton compte Overbound est créé. Voici par où commencer."
      hero={{ photo: 'P1091298', alt: 'Deux participants courent vers l’arrivée' }}
    >
      <Eyebrow>Compte créé</Eyebrow>
      <Title>{firstName ? `Bienvenue ${firstName}` : 'Bienvenue chez Overbound'}</Title>
      <Paragraph>
        Ton compte est créé. Pour t’inscrire à une course, c’est par ici. Les places sont limitées pour chaque événement.
      </Paragraph>
      <CtaButton href={eventsUrl}>Voir les courses</CtaButton>

      <SectionTitle>Par où commencer</SectionTitle>
      <Steps
        items={[
          {
            title: 'Complète ton profil',
            text: (
              <>
                Ça évite de tout retaper à l’inscription et facilite ton arrivée le jour J.{' '}
                <a href={accountUrl} style={{ color: '#1c7a1c' }}>
                  Ouvrir mon profil
                </a>
              </>
            ),
          },
          { title: 'Choisis ta course', text: 'OPEN pour courir à ton rythme, RANKED pour aller le plus loin possible.' },
          {
            title: 'Prépare-toi',
            text: (
              <>
                Conseils d’entraînement, nutrition et récits de participants sur le{' '}
                <a href={blogUrl} style={{ color: '#1c7a1c' }}>
                  blog
                </a>
                .
              </>
            ),
          },
        ]}
      />
    </EmailLayout>
  )
}

export default OnboardingEmail
