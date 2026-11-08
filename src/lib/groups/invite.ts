/** `?invite=CODE` on the registration page: the visitor was invited to a group. */
export const parseInviteCode = (value: string | null | undefined): string | null => {
  const code = (value ?? '').trim().toUpperCase()
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null
}

export const buildInviteUrl = (origin: string, eventSlug: string, inviteCode: string) =>
  `${origin}/events/${eventSlug}/register?invite=${encodeURIComponent(inviteCode)}`

export const buildInviteMessage = (eventTitle: string, inviteUrl: string) =>
  `Rejoins mon groupe pour ${eventTitle} : on part ensemble ! ${inviteUrl}`

export const buildWhatsAppUrl = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`

/** Group name proposed without asking: "Groupe de Camille", else a neutral fallback. */
export const defaultGroupName = (firstName: string | null | undefined) => {
  const name = (firstName ?? '').trim()
  return name ? `Groupe de ${name}` : 'Mon groupe'
}
