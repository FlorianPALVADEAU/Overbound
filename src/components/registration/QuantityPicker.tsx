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
        className="h-8 w-8"
        disabled={disableDecrement}
        onClick={onDecrement}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <div className="w-10 text-center text-sm font-semibold">{value}</div>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disableIncrement}
        onClick={onIncrement}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
