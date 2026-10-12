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
  onPhotoPackToggle: (upsellId: string, ticketId: string, checked: boolean) => void
}

export default function OptionsStep({
  upsells,
  selectedUpsells,
  selectedTicketSlots,
  participants,
  defaultCurrency,
  onQuantityChange,
  onSizeChange,
  onPhotoPackToggle,
}: OptionsStepProps) {
  return (
    <div className="space-y-3">
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
          onPhotoPackToggle={onPhotoPackToggle}
        />
      ))}
    </div>
  )
}
