'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Container, Section, SectionHeader, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

interface Props {
  isOnSale: boolean
  registerHref: string
  onCtaClick?: () => void
}

const GROUP_OPTIONS = [
  {
    title: 'Entre potes',
    body: 'Challenge, fun et souvenirs. Vous vous tirez vers le haut, tour après tour.',
  },
  {
    title: 'En couple',
    body: 'Une expérience à deux, intense et mémorable, loin des sorties classiques.',
  },
  {
    title: 'Solo',
    body: 'Tu viens seul, tu repars plus fort. C’est ton terrain de dépassement personnel.',
  },
]

export function UltraArenaComeTogether({ isOnSale, registerHref, onCtaClick }: Props) {
  return (
    <Section>
      <div className="absolute inset-0">
        <Image
          src="/images/images/a-group-of-friends-celebrating-after-a-hard-obstacle.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_40%] opacity-20"
        />
      </div>
      <Container className="relative z-10">
        <SectionHeader
          eyebrow={<>Dynamique de groupe</>}
          title={<>Tu viens avec qui ?</>}
          lead={<>Le choix t&apos;appartient. Ce qui compte: décider d&apos;y aller.</>}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {GROUP_OPTIONS.map(({ title, body }, index) => (
            <Card key={title} variant="feature">
              <CardContent className="p-6">
                <p
                  aria-hidden
                  className="mb-4 font-display text-5xl font-bold leading-none text-primary/35"
                >
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className={cn(DISPLAY_TITLE, 'text-title')}>{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          {isOnSale ? (
            <Button asChild size="cta" onClick={onCtaClick}>
              <Link href={registerHref}>On y va à plusieurs 🔥</Link>
            </Button>
          ) : (
            <Button asChild size="cta" variant="outline">
              <a href="#formats">Voir les formats</a>
            </Button>
          )}
        </div>
      </Container>
    </Section>
  )
}
