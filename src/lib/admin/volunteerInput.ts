import { z } from 'zod'

const requiredText = (message: string) => z.string().trim().min(1, message)

const optionalText = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  })

/** Body of POST /api/admin/volunteers/assignment: one volunteer notified of one shift. */
export const volunteerAssignmentSchema = z.object({
  volunteerId: z.string().uuid('Bénévole invalide'),
  email: z.string().trim().email('Email bénévole invalide'),
  fullName: optionalText,
  eventId: z.string().uuid('Événement invalide'),
  eventTitle: requiredText('Titre de l’événement manquant'),
  eventDate: requiredText('Date de l’événement manquante'),
  eventLocation: requiredText('Lieu de l’événement manquant'),
  shiftStart: requiredText('Début de créneau manquant'),
  shiftEnd: requiredText('Fin de créneau manquante'),
  arrivalInstructions: optionalText,
  contactEmail: optionalText,
  contactPhone: optionalText,
  checkinUrl: optionalText,
})

export type VolunteerAssignmentInput = z.infer<typeof volunteerAssignmentSchema>
