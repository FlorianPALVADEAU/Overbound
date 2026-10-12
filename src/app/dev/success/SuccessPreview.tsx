'use client'

import { EventSuccessView } from '@/components/events/success/EventSuccessView'

export function SuccessPreview({ count }: { count: number }) {
  const registrations = Array.from({ length: count }, (_, index) => ({
    id: `preview-${index}`,
    email: `participant.avec.un.email.assez.long.${index + 1}@exemple-entreprise.fr`,
    race_format: index % 3 === 2 ? 'ranked' : 'open',
    start_time: '2026-09-12T13:20:00+02:00',
    ticket: { id: 't1', name: 'OPEN - Ultra Arena' },
  }))
  return (
    <EventSuccessView
      preview
      eventSlug="ultra-arena-2026"
      hasFirstName
      registrations={registrations}
      registration={{
        id: 'preview',
        start_time: '2026-09-12T13:20:00+02:00',
        event: {
          id: 'e1',
          slug: 'ultra-arena-2026',
          title: 'Ultra Arena 2026',
          subtitle: 'La course à obstacles où tu choisis ton niveau',
          date: '2026-09-12T08:00:00+02:00',
          location: 'Île de loisirs de Saint-Quentin-en-Yvelines',
        },
        ticket: {
          id: 't1',
          name: 'OPEN - Ultra Arena Primal Experience Édition Limitée',
          race: { name: 'Ultra Arena', difficulty: 7, distance_km: 21 },
        },
        order: { id: 'o1', amount_total: 4500 * count, currency: 'eur' },
      }}
    />
  )
}
