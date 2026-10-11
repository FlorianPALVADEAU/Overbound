'use client'

import { useEffect } from 'react'
import { consumeResumeAfterLogin, useVolunteerApplication } from '@/hooks/volunteers/useVolunteerApplication'
import { EVENT_SELECTION_ANY, EVENT_SELECTION_CUSTOM } from '@/lib/volunteers/apply/formValues'
import { DEFAULT_MISSION, podCatalog } from '@/lib/volunteers/shared/Pod'
import { cn } from '@/lib/utils'
import { ApplicationForm } from './ApplicationForm'
import { PodMap } from './PodMap'
import { Container, Section, SectionHeader, DISPLAY_TITLE } from '@/components/ds'
import { VolunteerBib } from './VolunteerBib'

const podCard = (checked: boolean) =>
  cn(
    'relative block cursor-pointer rounded-2xl border p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white motion-reduce:transition-none sm:p-5',
    checked ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/30',
  )

export function VolunteerApply() {
  const application = useVolunteerApplication()
  const { values, events, setValue, submitted, draftRestored, isAuthenticated } = application

  // Retour de connexion depuis le formulaire : on ramène le visiteur sur sa candidature.
  // Une simple visite avec un ancien brouillon ne fait jamais défiler la page.
  useEffect(() => {
    if (draftRestored && isAuthenticated && consumeResumeAfterLogin()) {
      document.getElementById('candidature')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [draftRestored, isAuthenticated])

  const eventLabel = (() => {
    switch (values.eventSelection) {
      case '':
        return ''
      case EVENT_SELECTION_ANY:
        return 'Plusieurs événements'
      case EVENT_SELECTION_CUSTOM:
        return values.customEventName
      default:
        return events.find((event) => event.id === values.eventSelection)?.title ?? ''
    }
  })()

  const missionLabel = values.mission === DEFAULT_MISSION ? 'Surprise de la tribu' : values.mission

  return (
    <>
      <Section id="postes">
        <Container>
          <SectionHeader eyebrow="Ton poste" title="Choisis ton poste" />

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-14">
          <figure className="hidden lg:block">
            <PodMap selected={values.mission} onSelect={(title) => setValue('mission', title)} />
            <figcaption className="mt-3 text-sm text-muted-foreground">
              Plan indicatif du parcours. Les numéros correspondent aux postes de la liste.
            </figcaption>
          </figure>

          <fieldset>
            <legend className="sr-only">Choisis ton poste</legend>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {podCatalog.all().map((pod, index) => {
                const checked = values.mission === pod.title
                return (
                  <label key={pod.key} className={podCard(checked)}>
                    <input
                      type="radio"
                      name="mission"
                      value={pod.title}
                      checked={checked}
                      onChange={() => setValue('mission', pod.title)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span className={cn(DISPLAY_TITLE, 'block text-title')}>
                      <span className="hidden text-primary lg:inline">{index + 1}. </span>
                      {pod.title}
                    </span>
                    {pod.description ? (
                      <span className="mt-1 block text-sm text-muted-foreground">{pod.description}</span>
                    ) : null}
                  </label>
                )
              })}
              <label className={cn(podCard(values.mission === DEFAULT_MISSION), 'flex items-center')}>
                <input
                  type="radio"
                  name="mission"
                  value={DEFAULT_MISSION}
                  checked={values.mission === DEFAULT_MISSION}
                  onChange={() => setValue('mission', DEFAULT_MISSION)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className={cn(DISPLAY_TITLE, 'block text-title')}>Je laisse l’équipe décider</span>
              </label>
            </div>
          </fieldset>
          </div>
        </Container>
      </Section>

      <Section id="candidature" tone="light" edge="mountain">
        <Container>
          <SectionHeader eyebrow="Candidature" title="Postule maintenant" />

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:mt-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14">
            <div className="mx-auto hidden w-full min-w-0 max-w-sm lg:sticky lg:top-28 lg:block">
              <VolunteerBib
                name={`${values.firstName} ${values.lastName}`.trim()}
                mission={missionLabel}
                eventLabel={eventLabel}
                confirmed={Boolean(submitted)}
              />
            </div>

            <div className="tone-dark min-w-0 rounded-2xl bg-card p-5 text-foreground shadow-2xl shadow-black/30 sm:p-8">
              <ApplicationForm application={application} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
