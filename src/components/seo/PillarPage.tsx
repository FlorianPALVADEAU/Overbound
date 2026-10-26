import Link from 'next/link'
import { ogImageUrl } from '@/lib/seo/ogImage'
import type { Metadata } from 'next'
import { Container, Section, SectionHeader } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { safeJsonStringify } from '@/lib/safeJson'
import { buildPillarJsonLd } from '@/lib/seo/pillarJsonLd'
import type { PillarContent } from '@/lib/seo/pillarPages'
import { TEASER_VIDEO } from '@/lib/seo/siteFacts'

export const pillarMetadata = (content: PillarContent): Metadata => ({
  title: { absolute: content.title },
  description: content.description,
  alternates: { canonical: content.path },
  openGraph: {
    title: content.title,
    description: content.description,
    url: content.path,
    type: 'article',
    locale: 'fr_FR',
    images: [ogImageUrl({ title: content.heading, kicker: content.eyebrow, photo: 'crowd' })],
  },
})

export function PillarPage({ content }: { content: PillarContent }) {
  return (
    <main>
      {buildPillarJsonLd(content).map((node, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(node) }} />
      ))}

      <Section>
        <Container size="prose">
          <SectionHeader as="h1" eyebrow={content.eyebrow} title={content.heading} lead={content.answer} />
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {content.facts.map(({ label, value }) => (
              <div key={label} className="flex min-w-0 flex-col gap-2 bg-background p-4 sm:p-6">
                <dt className="text-label font-semibold uppercase text-subtle">{label}</dt>
                <dd className="text-base">{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section tone="deep">
        <Container size="prose" className="space-y-12">
          {content.sections.map((section) => (
            <article key={section.heading}>
              <SectionHeader title={section.heading} flush />
              <div className="mt-3 space-y-4 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
          {content.video ? (
            <video
              controls
              preload="none"
              poster={TEASER_VIDEO.posterPath}
              aria-label={TEASER_VIDEO.name}
              className="aspect-video w-full rounded-2xl border border-border bg-surface-deep"
            >
              <source src={TEASER_VIDEO.contentPath} type="video/mp4" />
            </video>
          ) : null}
        </Container>
      </Section>

      <Section>
        <Container size="prose">
          <SectionHeader eyebrow="Questions fréquentes" title="FAQ" />
          <div className="grid gap-4">
            {content.faq.map(({ question, answer }) => (
              <Card key={question} variant="info" className="p-4 sm:p-6">
                <h3 className="text-title font-display font-bold uppercase">{question}</h3>
                <p className="mt-3 text-muted-foreground">{answer}</p>
              </Card>
            ))}
          </div>
          <nav aria-label="Pages liées" className="mt-12 flex flex-wrap gap-3">
            {content.related.map((link) => (
              <Button key={link.href} asChild variant="outline" size="cta">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>
        </Container>
      </Section>
    </main>
  )
}
