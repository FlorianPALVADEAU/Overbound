import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gift } from 'lucide-react'
import type { EventUpsell, Participant, SelectedUpsellState } from './types'
import UpsellCard from './UpsellCard'

interface OptionsStepProps {
  upsells: EventUpsell[]
  selectedUpsells: SelectedUpsellState
  selectedTicketSlots: string[]
  participants: Participant[]
  defaultCurrency: string
  onQuantityChange: (upsellId: string, quantity: number) => void
  onSizeChange: (upsellId: string, index: number, size: string) => void
  onAssignmentToggle: (upsellId: string, ticketId: string, checked: boolean) => void
}

export default function OptionsStep({
  upsells,
  selectedUpsells,
  selectedTicketSlots,
  participants,
  defaultCurrency,
  onQuantityChange,
  onSizeChange,
  onAssignmentToggle,
}: OptionsStepProps) {
  return (
    <div className="space-y-4">
      {upsells.length === 0 ? (
        <Alert>
          <Gift className="h-4 w-4" />
          <AlertDescription>Pas d'options additionnelles disponibles pour cet événement.</AlertDescription>
        </Alert>
      ) : null}

      {upsells.map((upsell) => (
        <UpsellCard
          key={upsell.id}
          upsell={upsell}
          selection={selectedUpsells[upsell.id]}
          selectedTicketSlots={selectedTicketSlots}
          participants={participants}
          defaultCurrency={defaultCurrency}
          onQuantityChange={onQuantityChange}
          onSizeChange={onSizeChange}
          onAssignmentToggle={onAssignmentToggle}
        />
      ))}
    </div>
  )
}
