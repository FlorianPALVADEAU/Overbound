import type { EventUpsell, Participant, SelectedUpsellState } from './types'
import UpsellCard from './UpsellCard'

interface OptionsStepProps {
  upsells: EventUpsell[]
  selectedUpsells: SelectedUpsellState
  participants: Participant[]
  defaultCurrency: string
  onSetForParticipant: (upsellId: string, participantId: string, quantity: number, size?: string) => void
  onSetForAll: (upsellId: string, quantity: number) => void
  onClear: (upsellId: string) => void
  onSizeForAll: (upsellId: string, size: string) => void
}

export default function OptionsStep({
  upsells,
  selectedUpsells,
  participants,
  defaultCurrency,
  onSetForParticipant,
  onSetForAll,
  onClear,
  onSizeForAll,
}: OptionsStepProps) {
  return (
    <div className="space-y-3">
      {upsells.map((upsell) => (
        <UpsellCard
          key={upsell.id}
          upsell={upsell}
          selection={selectedUpsells[upsell.id]}
          participants={participants}
          defaultCurrency={defaultCurrency}
          onSetForParticipant={onSetForParticipant}
          onSetForAll={onSetForAll}
          onClear={onClear}
          onSizeForAll={onSizeForAll}
        />
      ))}
    </div>
  )
}
