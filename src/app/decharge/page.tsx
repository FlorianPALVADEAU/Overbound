import type { Metadata } from 'next'
import Link from 'next/link'
import { OFFICIAL_RULEBOOK_PDF_PATH, REGULATION_VERSION } from '@/constants/registration'
import { WAIVER_CLAUSES, WAIVER_INTRO, WAIVER_TITLE } from '@/constants/waiver'
import { Container, DISPLAY_TITLE, Eyebrow, Section } from '@/components/ds'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: { absolute: 'Décharge de responsabilité | Overbound Race' },
  description: 'Texte de la décharge de responsabilité signée par chaque participant Overbound.',
  alternates: { canonical: 'https://overbound-race.com/decharge' },
  robots: { index: false, follow: true },
}

/** Public copy of the waiver, linked from ticket emails so every participant can read what was signed for them. */
export default function WaiverPage() {
  return (
    <main className="min-h-screen bg-background">
      <Section spacing="compact">
      <Container size="prose">
        <Eyebrow>Version {REGULATION_VERSION}</Eyebrow>
        <h1 className={cn(DISPLAY_TITLE, 'mt-2 text-display-md')}>{WAIVER_TITLE}</h1>
        <p className="mt-6 leading-relaxed text-muted-foreground">{WAIVER_INTRO}</p>
        <ol className="mt-6 space-y-4 leading-relaxed">
          {WAIVER_CLAUSES.map((clause) => (
            <li key={clause.id}>
              <span className="font-bold">{clause.id}.</span> {clause.text}
            </li>
          ))}
        </ol>
        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          Documents liés :{' '}
          <Link href={OFFICIAL_RULEBOOK_PDF_PATH} className="text-primary hover:underline">
            règlement officiel (PDF)
          </Link>
          {' · '}
          <Link href="/cgv" className="text-primary hover:underline">
            CGV
          </Link>
          {' · '}
          <Link href="/privacy-policies" className="text-primary hover:underline">
            politique de confidentialité
          </Link>
        </p>
      </Container>
      </Section>
    </main>
  )
}
