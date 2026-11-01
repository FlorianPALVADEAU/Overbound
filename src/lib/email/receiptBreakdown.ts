/**
 * Receipt layout for an order that covers several participants. Every ticket, option and flexible
 * fee is listed under the participant it belongs to, so the buyer can tell who has what. Options
 * that were not assigned to anyone (older clients) go on the order itself.
 * Amounts leave this module in euros, as the receipt email expects.
 */
export interface ReceiptLine {
  description: string
  /** Extra info shown under the description, e.g. a t-shirt size. */
  detail?: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ReceiptParticipant {
  name: string
  lines: ReceiptLine[]
}

export interface ReceiptBreakdown {
  participants: ReceiptParticipant[]
  /** Lines that belong to no participant in particular. */
  orderLines: ReceiptLine[]
}

export interface BreakdownParticipantInput {
  name: string | null
  ticketLabel: string
  ticketUnitCents: number
  flexible: boolean
  /** OPEN companion bib taken with this ticket: its own line, at its fixed price. */
  companion?: { label: string; cents: number }
}

export interface BreakdownOptionInput {
  name: string
  unitCents: number
  quantity: number
  /** null or empty when the option was not assigned to participants. */
  assignments: Array<{ participantIndex: number; quantity: number; size?: string }> | null
}

const toEuros = (cents: number) => cents / 100

const line = (description: string, unitCents: number, quantity: number, detail?: string): ReceiptLine => ({
  description,
  ...(detail ? { detail } : {}),
  quantity,
  unitPrice: toEuros(unitCents),
  total: toEuros(unitCents * quantity),
})

export function buildReceiptBreakdown(input: {
  participants: BreakdownParticipantInput[]
  options: BreakdownOptionInput[]
  flexibleFeeCents: number
}): ReceiptBreakdown {
  const participants: ReceiptParticipant[] = input.participants.map((participant, index) => ({
    name: participant.name?.trim() || `Participant ${index + 1}`,
    lines: [
      line(participant.ticketLabel, participant.ticketUnitCents, 1),
      ...(participant.companion ? [line(participant.companion.label, participant.companion.cents, 1)] : []),
      ...(participant.flexible ? [line('Option billet flexible', input.flexibleFeeCents, 1)] : []),
    ],
  }))
  const orderLines: ReceiptLine[] = []

  for (const option of input.options) {
    const assignments = option.assignments ?? []
    if (assignments.length === 0) {
      orderLines.push(line(option.name, option.unitCents, option.quantity))
      continue
    }
    for (const assignment of assignments) {
      const target = participants[assignment.participantIndex]
      const detail = assignment.size ? `Taille ${assignment.size}` : undefined
      const entry = line(option.name, option.unitCents, assignment.quantity, detail)
      if (target) target.lines.push(entry)
      else orderLines.push(entry)
    }
  }

  return { participants, orderLines }
}

export const sumLines = (lines: ReceiptLine[]): number => lines.reduce((sum, entry) => sum + entry.total, 0)
