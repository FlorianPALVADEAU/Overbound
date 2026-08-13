export const TRANSFER_DEADLINE_DAYS_BEFORE_EVENT = 7

export const getTransferDeadline = (eventDateIso: string | null | undefined) => {
  if (!eventDateIso) return null
  const eventDate = new Date(eventDateIso)
  if (Number.isNaN(eventDate.getTime())) return null

  const deadline = new Date(eventDate)
  deadline.setDate(deadline.getDate() - TRANSFER_DEADLINE_DAYS_BEFORE_EVENT)
  return deadline
}

export const isTicketTransferAllowed = (
  eventDateIso: string | null | undefined,
  now: Date = new Date(),
) => {
  const deadline = getTransferDeadline(eventDateIso)
  if (!deadline) return false
  return now.getTime() <= deadline.getTime()
}
