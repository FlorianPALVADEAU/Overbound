import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Container, Eyebrow, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

interface Props {
  formattedDate: string
  href: string
  label: string
  onClick: () => void
}

/** Last push before the footer: one line, one button (content of a deep Section). */
export function EventFinalCta({ formattedDate, href, label, onClick }: Props) {
  return (
    <Container className="flex flex-col items-center gap-6 text-center">
      <Eyebrow>{formattedDate}</Eyebrow>
      <h2 className={cn(DISPLAY_TITLE, 'max-w-3xl text-display-lg')}>Ta place t&apos;attend.</h2>
      <Button asChild size="hero" className="min-w-56">
        <Link href={href} onClick={onClick}>
          {label}
        </Link>
      </Button>
    </Container>
  )
}
