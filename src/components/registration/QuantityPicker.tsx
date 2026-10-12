import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

interface QuantityPickerProps {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  disableDecrement?: boolean
  disableIncrement?: boolean
}

export default function QuantityPicker({
  value,
  onIncrement,
  onDecrement,
  disableDecrement = false,
  disableIncrement = false,
}: QuantityPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        disabled={disableDecrement}
        onClick={onDecrement}
        aria-label="Retirer un"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="w-8 text-center text-base font-semibold">{value}</div>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        disabled={disableIncrement}
        onClick={onIncrement}
        aria-label="Ajouter un"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
