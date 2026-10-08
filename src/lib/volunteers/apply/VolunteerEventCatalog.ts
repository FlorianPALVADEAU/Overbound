import { z } from 'zod'
import { EVENT_SELECTION_ANY, EVENT_SELECTION_CUSTOM, type VolunteerFormValues } from './formValues'

export interface VolunteerEventOption {
  id: string
  title: string
  date: string | null
  location: string | null
  status: string | null
}

const OPEN_STATUSES = ['announced', 'on_sale', 'sold_out']
// Un événement reste proposé quelques jours après sa date (bénévoles de démontage et débrief).
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000

const rawEventSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullish(),
  date: z.string().nullish(),
  location: z.string().nullish(),
  status: z.string().nullish(),
})

const toTime = (date: string | null): number | null => {
  if (!date) return null
  const time = Date.parse(date)
  return Number.isNaN(time) ? null : time
}

// Les événements auxquels un bénévole peut se rattacher, et le nom retenu pour sa candidature.
export class VolunteerEventCatalog {
  constructor(private readonly events: readonly VolunteerEventOption[]) {}

  static fromApiPayload(payload: unknown, now: number = Date.now()): VolunteerEventCatalog {
    if (!Array.isArray(payload)) throw new Error('Réponse inattendue du serveur.')

    const options = payload.flatMap((entry): VolunteerEventOption[] => {
      const parsed = rawEventSchema.safeParse(entry)
      if (!parsed.success) return []
      const { id, title, date, location, status } = parsed.data
      return [
        { id: String(id), title: title || 'Événement Overbound', date: date ?? null, location: location ?? null, status: status ?? null },
      ]
    })

    return new VolunteerEventCatalog(
      options
        .filter((event) => {
          if (!OPEN_STATUSES.includes(event.status ?? '')) return false
          const time = toTime(event.date)
          return time === null || time >= now - GRACE_PERIOD_MS
        })
        .sort((a, b) => (toTime(a.date) ?? Number.POSITIVE_INFINITY) - (toTime(b.date) ?? Number.POSITIVE_INFINITY)),
    )
  }

  list(): readonly VolunteerEventOption[] {
    return this.events
  }

  resolve(values: Pick<VolunteerFormValues, 'eventSelection' | 'customEventName'>): { eventId?: string; eventName?: string } {
    switch (values.eventSelection) {
      case EVENT_SELECTION_CUSTOM:
        return { eventName: values.customEventName.trim() || undefined }
      case EVENT_SELECTION_ANY:
        return { eventName: 'Disponible pour plusieurs événements' }
      case '':
        return {}
      default:
        return {
          eventId: values.eventSelection,
          eventName: this.events.find((event) => event.id === values.eventSelection)?.title,
        }
    }
  }
}
