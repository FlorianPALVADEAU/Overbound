import type { ReactNode } from 'react'
import { Container, Section, SectionHeader } from '@/components/ds'

interface Props {
  eyebrow?: string
  title: string
  lead?: ReactNode
  /** "Dernière mise à jour : …" line, shown under the lead. */
  updated?: ReactNode
  size?: 'page' | 'prose'
}

/** Page header shared by the legal and policy pages: same title, same rhythm. */
export function LegalHeader({ eyebrow, title, lead, updated, size = 'page' }: Props) {
  return (
    <Section spacing="compact" className="border-b border-border">
      <Container size={size}>
        <SectionHeader as="h1" eyebrow={eyebrow} title={title} lead={lead} flush className={size === 'page' ? 'max-w-3xl' : undefined} />
        {updated ? <p className="mt-4 text-sm text-subtle">{updated}</p> : null}
      </Container>
    </Section>
  )
}
