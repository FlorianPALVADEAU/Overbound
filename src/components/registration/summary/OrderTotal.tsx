import { formatPrice } from '@/lib/registration'

interface OrderTotalProps {
  totalCents: number
  currency: string
}

export default function OrderTotal({ totalCents, currency }: OrderTotalProps) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-base font-semibold">Total</span>
      <span className="text-2xl font-bold">{formatPrice(totalCents, currency)}</span>
    </div>
  )
}
