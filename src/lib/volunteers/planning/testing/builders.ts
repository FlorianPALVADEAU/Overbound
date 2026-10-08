import { podCatalog, type PodKey } from '../../shared/Pod'
import type { Shift } from '../../shared/Shift'
import { Assignment, type AssignmentRole } from '../domain/Assignment'
import { VolunteerCandidate } from '../domain/VolunteerCandidate'

const LABEL_BY_SHIFTS = (shifts: readonly Shift[]) =>
  shifts.length === 2 ? 'Toute la journée' : shifts[0] === 'morning' ? 'Matin' : 'Après-midi'

export const candidate = (
  id: string,
  podKey: PodKey | null,
  shifts: Shift[] = ['morning', 'afternoon'],
): VolunteerCandidate =>
  VolunteerCandidate.fromRecord(
    {
      id,
      fullName: `Bénévole ${id}`,
      email: `${id}@example.com`,
      phone: null,
      availability: LABEL_BY_SHIFTS(shifts),
      mission: podKey ? (podCatalog.all().find((pod) => pod.key === podKey)?.title ?? '') : 'Je laisse l’équipe décider',
      eventId: 'evt',
      eventSnapshotId: 'evt',
    },
    podCatalog,
  )

export const assignment = (
  id: string | null,
  shift: Shift,
  zoneKey: string,
  options: { role?: AssignmentRole; locked?: boolean; name?: string } = {},
): Assignment =>
  new Assignment({
    id: id ? `row-${id}-${shift}` : undefined,
    applicationId: id,
    displayName: options.name ?? `Bénévole ${id ?? 'x'}`,
    shift,
    zoneKey,
    role: options.role ?? 'member',
    locked: options.locked ?? false,
  })
