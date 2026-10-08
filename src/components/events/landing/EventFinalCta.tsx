import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_X } from './layout'

interface Props {
  formattedDate: string
  href: string
  label: string
  onClick: () => void
}

/** Last push before the footer: plain black, one line, one button. */
export function EventFinalCta({ formattedDate, href, label, onClick }: Props) {
  return (
    <div className={`${LANDING_X} flex flex-col items-center gap-6 py-16 text-center sm:py-24`}>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">{formattedDate}</p>
      <h2 className="max-w-3xl text-balance text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
        Ta place t&apos;attend.
      </h2>
      <Button asChild size="lg" className="h-14 min-w-56 rounded-2xl px-10 text-base font-black">
        <Link href={href} onClick={onClick}>
          {label}
        </Link>
      </Button>
    </div>
  )
}
