import * as React from 'react'
import EmailLayout from './EmailLayout'
import { Checklist, CtaButton, Eyebrow, FactList, Paragraph, SectionTitle, SmallPrint, Steps, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'

interface VolunteerEventInfo {
  id: string
  title: string
  date: string
  location: string
  checkinWindow?: string | null
}

interface VolunteerRecruitmentEmailProps {
  fullName?: string | null
  headlineEvent: VolunteerEventInfo
  otherEvents?: VolunteerEventInfo[]
  callToActionUrl: string
}

function formatEventDate(date: string): string | null {
  if (Number.isNaN(Date.parse(date))) return null
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  })
}

export default function VolunteerRecruitmentEmail({
  fullName,
  headlineEvent,
  otherEvents = [],
  callToActionUrl,
}: VolunteerRecruitmentEmailProps) {
  const firstName = getFirstName(fullName)
  const eventDate = formatEventDate(headlineEvent.date)

  return (
    <EmailLayout
      preview={`${headlineEvent.title} : choisis ton poste et ton créneau, on te répond sous 48 h.`}
      hero={{ photo: 'P1090801', alt: 'Des bénévoles Overbound sur le parcours' }}
    >
      <Eyebrow>Bénévoles</Eyebrow>
      <Title>Tu ne cours pas. Tu fais courir.</Title>
      <Paragraph>
        {firstName ? `${firstName}, ` : ''}pour <strong>{headlineEvent.title}</strong>, on monte l’équipe de bénévoles. Tu choisis
        ton poste et ton créneau (matin, après-midi ou journée). En échange, ton inscription à une course Overbound est offerte.
      </Paragraph>

      <FactList
        rows={[
          { label: 'Événement', value: headlineEvent.title },
          { label: 'Date', value: eventDate },
          { label: 'Lieu', value: headlineEvent.location },
          { label: 'Accueil des bénévoles', value: headlineEvent.checkinWindow },
        ]}
      />

      <CtaButton href={callToActionUrl}>Choisir mon poste</CtaButton>

      <SectionTitle>Ce que tu reçois</SectionTitle>
      <Checklist
        items={[
          <>
            <strong>Une inscription offerte</strong> à la course Overbound de ton choix, ou à offrir à un proche
          </>,
          <>
            <strong>Repas et boissons</strong> sur place
          </>,
          <>
            <strong>La tenue de bénévole</strong>, pour être reconnu·e sur le parcours
          </>,
          <>
            <strong>Les coulisses</strong> : tu vois la course de l’intérieur, avec l’équipe
          </>,
        ]}
      />

      <SectionTitle>Comment ça se passe</SectionTitle>
      <Steps
        items={[
          { title: 'Tu postules', text: 'Un formulaire court : ton poste, ton créneau, tes disponibilités.' },
          { title: 'On te répond sous 48 h', text: 'Tu reçois ta mission, tes horaires et les consignes d’arrivée.' },
          { title: 'Le jour J', text: 'Brief au départ, puis ton poste sur le parcours. Débrief et remerciements à la fin.' },
        ]}
      />

      {otherEvents.length > 0 ? (
        <SmallPrint>
          Aussi à venir :{' '}
          {otherEvents
            .map((event) => [event.title, formatEventDate(event.date)].filter(Boolean).join(', '))
            .join(' · ')}
          .
        </SmallPrint>
      ) : null}
      <SmallPrint>Une question avant de postuler ? Réponds simplement à cet email.</SmallPrint>
    </EmailLayout>
  )
}
