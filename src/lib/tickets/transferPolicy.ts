export const TRANSFER_DEADLINE_DAYS_BEFORE_EVENT = 1

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

/** Fee the current holder pays to unlock the hand-over of a bib (charged once per transfer). */
export const TICKET_TRANSFER_FEE_CENTS = 699
export const TICKET_TRANSFER_CURRENCY = 'eur'

export const formatTransferFee = (amountCents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: TICKET_TRANSFER_CURRENCY.toUpperCase() }).format(
    amountCents / 100,
  )
