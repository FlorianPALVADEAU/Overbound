import type { GroupIntent } from '@/lib/groups/invite'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { Upsell, UpsellOptions } from '@/types/Upsell'
import type { PromotionalCode } from '@/types/PromotionalCode'
import type { EventPriceTier } from '@/types/EventPriceTier'

export interface EventTicket extends Ticket {
  current_registrations?: number
  race?: Ticket['race'] & {
    type?: string | null
    target_public?: string | null
    description?: string | null
    is_universal?: boolean
    obstacles?: Array<{
      order_position: number
      is_mandatory: boolean
      obstacle: { id: string; name: string }
    }>
  }
}

export type EventUser = {
  id: string
  email: string
  fullName?: string | null
  date_of_birth?: string | null
}

export type EventUpsell = Upsell & {
  options?: UpsellOptions | null
}

export type StepKey = 'tickets' | 'participants' | 'options' | 'confirmation'

export type Participant = {
  id: string
  ticketId: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalInfo: string
  licenseNumber: string
  difficultyLevel?: 'low' | 'mid' | 'hard' | null
  selectedWaveIndex?: number | null
}

export type SelectedUpsellState = Record<string, { quantity: number; meta?: Record<string, any> }>

export type TicketSelections = Record<string, number>

export type AppliedPromo = Pick<
  PromotionalCode,
  | 'id'
  | 'code'
  | 'description'
  | 'discount_percent'
  | 'discount_amount'
  | 'currency'
  | 'is_ambassador'
  | 'target_upsell_id'
>

export interface PricingSummary {
  ticketTotal: number
  upsellTotal: number
  discountAmount: number
  totalDue: number
  currency: string
}

export type UpsellSummaryItem = {
  id: string
  label: string
  quantity: number
  amount: number
  currency: string
  details: string[]
}

export interface MultiStepEventRegistrationProps {
  event: Event
  tickets: EventTicket[]
  upsells: EventUpsell[]
  user: EventUser | null
  availableSpots: number
  initialTicketId?: string | null
  /** Slot preselected from the event page; applied once to the first matching participant. */
  initialWaveIndex?: number | null
  /** Open a group action on arrival (?group=create|join). */
  groupIntent?: GroupIntent | null
  /** Group the visitor was invited to (?invite=CODE). */
  inviteCode?: string | null
  eventPriceTiers?: EventPriceTier[]
}
