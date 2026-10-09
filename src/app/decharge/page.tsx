import type { Metadata } from 'next'
import Link from 'next/link'
import { OFFICIAL_RULEBOOK_PDF_PATH, REGULATION_VERSION } from '@/constants/registration'
import { WAIVER_CLAUSES, WAIVER_INTRO, WAIVER_TITLE } from '@/constants/waiver'

export const metadata: Metadata = {
  title: 'Décharge de responsabilité | Overbound Race',
  description: 'Texte de la décharge de responsabilité signée par chaque participant Overbound.',
  alternates: { canonical: 'https://overbound-race.com/decharge' },
  robots: { index: false, follow: true },
}

/** Public copy of the waiver, linked from ticket emails so every participant can read what was signed for them. */
export default function WaiverPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Version {REGULATION_VERSION}</p>
        <h1 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-4xl">{WAIVER_TITLE}</h1>
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
      </div>
    </main>
  )
}
