import Link from 'next/link'
import { Container, Section, SectionHeader, StatRow } from '@/components/ds'
import { FORMAT_FACTS, PILLAR_LINKS, PREVIOUS_EDITION } from '@/lib/seo/siteFacts'
import { loadNextEdition } from '@/lib/seo/loadNextEdition'

/**
 * Server-rendered facts for the homepage HTML (visitors, search engines and
 * answer engines read the same figures). Values come from siteFacts.
 */
export async function EditionFacts() {
  const next = await loadNextEdition()
  return (
    <Section tone="deep" spacing="compact">
      <Container>
        <SectionHeader
          eyebrow="Overbound en bref"
          title="Course à obstacles en boucles, en Île-de-France"
          lead={`Une boucle de ${FORMAT_FACTS.loopKm} km et plus de 10 obstacles, répétée. OPEN pour courir à ton rythme, RANKED pour aller le plus loin possible.`}
        />
        <StatRow
          stats={[
            { label: 'Dernière édition', value: PREVIOUS_EDITION.dateLabel },
            { label: 'Lieu', value: 'Saint-Quentin-en-Yvelines' },
            { label: 'Participants', value: '300+' },
            { label: 'Prochaine édition', value: next.shortLabel },
          ]}
          compact
        />
        <p className="mt-6 text-sm text-muted-foreground">
          {PREVIOUS_EDITION.name} s&apos;est tenue à l&apos;{PREVIOUS_EDITION.venue} avec {PREVIOUS_EDITION.participants}.{' '}
          {next.detailsStatus}{' '}
          <Link href={PILLAR_LINKS.facts.href} className="text-primary underline-offset-4 hover:underline">
            Tous les faits
          </Link>
          {' · '}
          <Link href={PILLAR_LINKS.paris.href} className="text-primary underline-offset-4 hover:underline">
            {PILLAR_LINKS.paris.label}
          </Link>
          {' · '}
          <Link href={PILLAR_LINKS.loops.href} className="text-primary underline-offset-4 hover:underline">
            {PILLAR_LINKS.loops.label}
          </Link>
        </p>
      </Container>
    </Section>
  )
}
