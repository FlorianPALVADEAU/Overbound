import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { Badge } from '@/components/ui/badge'
import { Container, Eyebrow, Pill, Section, SectionHeader, StatRow } from '@/components/ds'
import { DISPLAY_TITLE } from '@/components/ds/SectionHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Living reference of the design system (docs/design/design-system.md).
// Local and preview deployments only: never indexed, 404 in production.
export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
}

const TYPE_SCALE = [
  { token: 'text-display-xl', usage: 'H1 hero événement', sample: 'Ultra Arena', display: true },
  { token: 'text-display-lg', usage: 'H1 de page', sample: 'Choisis ton défi', display: true },
  { token: 'text-display-md', usage: 'H2 de section', sample: 'Pas une course standard', display: true },
  { token: 'text-title', usage: 'H3 de carte', sample: 'Format RANKED', display: true },
  { token: 'text-lead', usage: 'Chapeau', sample: 'Une boucle de 2 km, plus de 10 obstacles, autant de tours que tu veux.' },
  { token: 'text-base', usage: 'Corps', sample: 'Le format OPEN te permet de courir sans limite de temps.' },
  { token: 'text-sm', usage: 'Corps secondaire', sample: 'Accessible à tous, exigeant pour chacun.' },
  { token: 'text-eyebrow', usage: 'Eyebrow (uppercase)', sample: 'Pourquoi c’est différent', upper: true },
  { token: 'text-label', usage: 'Label (uppercase)', sample: 'Disponibilité', upper: true },
]

const SWATCHES = [
  { name: 'background', className: 'bg-background' },
  { name: 'surface-deep', className: 'bg-surface-deep' },
  { name: 'card', className: 'bg-card' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'signal', className: 'bg-signal' },
  { name: 'destructive', className: 'bg-destructive' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'info', className: 'bg-info' },
  { name: 'border', className: 'bg-border' },
]

const TEXT_LEVELS = [
  { name: 'text-foreground', className: 'text-foreground' },
  { name: 'text-muted-foreground', className: 'text-muted-foreground' },
  { name: 'text-subtle', className: 'text-subtle' },
  { name: 'text-primary', className: 'text-primary' },
]

const SPACING_SCALE = [1, 2, 3, 4, 6, 8, 12, 16]

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-6">
      <h3 className="mb-6 text-eyebrow font-semibold uppercase text-subtle">{title}</h3>
      {children}
    </div>
  )
}

export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === 'production') notFound()

  return (
    <div>
      <Section spacing="spacious">
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="Référence vivante"
            title="Design system Overbound"
            lead="Tokens, échelles et primitives. Source de vérité : docs/design/design-system.md."
            flush
          />
        </Container>
      </Section>

      <Section spacing="compact">
        <Container className="space-y-12">
          <Block title="Police display — Barlow Condensed 700">
            <p className={cn(DISPLAY_TITLE, 'text-display-md')}>Dépasse-toi · 12 sept. 2026 · 355 places</p>
            <p className="mt-2 font-display text-title font-bold uppercase text-muted-foreground">
              ÉÈÀÇ œ « Île de loisirs » 0123456789
            </p>
          </Block>

          <Block title="Échelle typographique">
            <div className="space-y-6">
              {TYPE_SCALE.map(({ token, usage, sample, display, upper }) => (
                <div key={token} className="grid gap-2 md:grid-cols-[14rem_1fr] md:items-baseline md:gap-8">
                  <p className="text-sm text-muted-foreground">
                    <code className="text-foreground">{token}</code> · {usage}
                  </p>
                  <p className={cn(token, display && DISPLAY_TITLE, upper && 'font-semibold uppercase text-primary')}>
                    {sample}
                  </p>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Couleurs">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {SWATCHES.map(({ name, className }) => (
                <div key={name} className="space-y-2">
                  <div className={cn('h-16 rounded-xl border border-border', className)} />
                  <code className="text-sm text-muted-foreground">{name}</code>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-2 sm:grid-cols-4">
              {TEXT_LEVELS.map(({ name, className }) => (
                <p key={name} className={cn('text-base font-semibold', className)}>
                  {name}
                </p>
              ))}
            </div>
          </Block>

          <Block title="Espacements (gap / space-y)">
            <div className="space-y-3">
              {SPACING_SCALE.map((step) => (
                <div key={step} className="flex items-center gap-4">
                  <code className="w-12 text-sm text-muted-foreground">{step}</code>
                  <div className="h-3 rounded-full bg-primary" style={{ width: `${step * 4}px` }} />
                  <span className="text-sm text-subtle">{step * 4}px</span>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Boutons">
            <div className="flex flex-wrap items-center gap-4">
              <Button size="hero">Je prends ma place</Button>
              <Button size="cta">
                Voir les formats <ArrowRight />
              </Button>
              <Button size="cta" variant="outline">
                Secondaire
              </Button>
              <Button size="cta" variant="signal">
                Je m&apos;inscris
              </Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </Block>

          <Block title="Eyebrows et pills">
            <div className="flex flex-wrap items-center gap-6">
              <Eyebrow>Eyebrow text</Eyebrow>
              <Eyebrow variant="pill">Eyebrow pill</Eyebrow>
              <Eyebrow variant="pill-soft">Eyebrow pill-soft</Eyebrow>
              <Pill>Inclus</Pill>
              <Pill variant="tag-muted">Non inclus</Pill>
              <Pill variant="glass">Glass chip</Pill>
            </div>
          </Block>

          <Block title="Cartes">
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {(['default', 'feature', 'info', 'glass'] as const).map((variant, index) => (
                <Card key={variant} variant={variant}>
                  <CardContent className="space-y-2">
                    <p aria-hidden className="font-display text-5xl font-bold leading-none text-primary/35">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h4 className={cn(DISPLAY_TITLE, 'text-title')}>{variant}</h4>
                    <p className="text-sm text-muted-foreground">Carte variant=&quot;{variant}&quot;.</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Block>

          <Block title="Back-office (AdminPageHeader, statuts)">
            <div className="space-y-6">
              <AdminPageHeader
                eyebrow="Billetterie"
                title="Gestion des billets"
                description="Titre de page admin : eyebrow, titre display, description, actions."
                actions={<Button>Nouveau billet</Button>}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-success/40 bg-success/15 text-success">Validé</Badge>
                <Badge className="border-warning/40 bg-warning/15 text-warning">En attente</Badge>
                <Badge className="border-info/40 bg-info/15 text-info">Information</Badge>
                <Badge variant="destructive">Refusé</Badge>
              </div>
            </div>
          </Block>

          <Block title="Rangée de chiffres">
            <StatRow
              stats={[
                { label: 'Date', value: '12', unit: 'sept. 2026' },
                { label: 'Lieu', value: 'SQY' },
                { label: 'Tarif', value: 'dès 45 €', highlight: true },
                { label: 'Disponibilité', value: '355', unit: 'places' },
              ]}
            />
          </Block>
        </Container>
      </Section>

      <Section tone="light" edge="mountain">
        <Container>
          <SectionHeader
            eyebrow="tone=light · edge=mountain"
            title="Bande claire, signature montagne"
            lead="Remplace les sections bg-white + mountain-vector.svg. Les tokens sont remappés : les mêmes classes fonctionnent."
          />
          <Card variant="info" className="max-w-md px-6">
            <p className="text-sm text-muted-foreground">Une carte info dans une bande claire.</p>
          </Card>
        </Container>
      </Section>

      <Section edge="angled" tone="light">
        <Container>
          <SectionHeader eyebrow="tone=light · edge=angled" title="Diagonale" flush />
        </Container>
      </Section>

      <Section tone="primary">
        <Container>
          <SectionHeader align="center" eyebrow="tone=primary" title="Bande verte" lead="Pour un appel fort." flush />
        </Container>
      </Section>

      <Section tone="deep" spacing="spacious" className="border-t border-primary/40">
        <Container className="text-center">
          <h2 className={cn(DISPLAY_TITLE, 'text-display-lg')}>CTA final · tone=deep</h2>
          <div className="mt-8 flex justify-center">
            <Button size="hero">Je prends ma place</Button>
          </div>
        </Container>
      </Section>
    </div>
  )
}
