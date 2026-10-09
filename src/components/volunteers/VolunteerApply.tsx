'use client'

import { useEffect } from 'react'
import { consumeResumeAfterLogin, useVolunteerApplication } from '@/hooks/volunteers/useVolunteerApplication'
import { EVENT_SELECTION_ANY, EVENT_SELECTION_CUSTOM } from '@/lib/volunteers/apply/formValues'
import { DEFAULT_MISSION, podCatalog } from '@/lib/volunteers/shared/Pod'
import { cn } from '@/lib/utils'
import { ApplicationForm } from './ApplicationForm'
import { PodMap } from './PodMap'
import { SectionHeading } from './SectionHeading'
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
      <section id="postes" className="scroll-mt-20 bg-background py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 xl:px-0">
          <SectionHeading eyebrow="Ton poste" title="Choisis ton poste" />

          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-14">
          <figure className="hidden lg:block">
            <PodMap selected={values.mission} onSelect={(title) => setValue('mission', title)} />
            <figcaption className="mt-3 text-sm text-gray-400">
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
                    <span className="block text-lg font-black text-white">
                      <span className="hidden text-primary lg:inline">{index + 1}. </span>
                      {pod.title}
                    </span>
                    {pod.description ? (
                      <span className="mt-1 block text-sm text-gray-300">{pod.description}</span>
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
                <span className="block text-lg font-black text-white">Je laisse l’équipe décider</span>
              </label>
            </div>
          </fieldset>
          </div>
        </div>
      </section>

      <section id="candidature" className="scroll-mt-16 bg-neutral-100 py-16 text-neutral-950 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 xl:px-0">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-neutral-500">Candidature</p>
          <h2 className="mt-3 text-balance wrap-break-word text-5xl font-black leading-[0.95] sm:text-7xl lg:text-8xl">
            Postule maintenant
          </h2>

          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:mt-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14">
            <div className="mx-auto hidden w-full min-w-0 max-w-sm lg:sticky lg:top-28 lg:block">
              <VolunteerBib
                name={`${values.firstName} ${values.lastName}`.trim()}
                mission={missionLabel}
                eventLabel={eventLabel}
                confirmed={Boolean(submitted)}
              />
            </div>

            <div className="min-w-0 rounded-2xl bg-neutral-900 p-5 text-white shadow-2xl shadow-black/30 sm:p-8">
              <ApplicationForm application={application} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
