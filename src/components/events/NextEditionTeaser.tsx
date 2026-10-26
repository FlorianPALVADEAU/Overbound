'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Camera, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Container, Section, SectionHeader } from '@/components/ds'
import type { LastEvent } from '@/lib/events/loadLastEvent'
import { NEXT_EDITION } from '@/lib/seo/siteFacts'

type Status = 'idle' | 'loading' | 'success' | 'error'

/** Thank-you and waiting-list page shown on /events between two editions. */
export function NextEditionTeaser({ lastEvent }: { lastEvent: LastEvent | null }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!lastEvent) return
    setStatus('loading')
    setMessage(null)
    try {
      const res = await fetch(`/api/events/${lastEvent.slug}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Erreur lors de la demande')
      }
      setStatus('success')
      setMessage("Parfait, on te prévient dès l'ouverture.")
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Erreur lors de la demande')
    }
  }

  return (
    <main>
      <Section spacing="spacious">
        <Container size="prose" className="text-center">
          <SectionHeader
            as="h1"
            eyebrow="Prochaine édition"
            title="On prépare la suite"
            lead={`Merci à toutes celles et ceux qui ont repoussé leurs limites en 2026. La prochaine édition d'Overbound, la course à obstacles en boucles de 2 km, aura lieu ${NEXT_EDITION.window}. ${NEXT_EDITION.detailsStatus}`}
          />

          {lastEvent ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border/60 bg-card p-6">
              {status === 'success' ? (
                <p className="text-sm font-semibold text-primary">{message}</p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <p className="text-sm font-semibold">Laisse ton email, on te prévient en premier.</p>
                  <Input
                    type="email"
                    aria-label="Ton adresse email"
                    required
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl text-base"
                  />
                  <Button type="submit" size="cta" className="w-full" disabled={status === 'loading'}>
                    <Mail className="mr-2 h-4 w-4" />
                    {status === 'loading' ? 'Envoi…' : 'Me prévenir'}
                  </Button>
                  {status === 'error' && message ? <p className="text-sm text-destructive">{message}</p> : null}
                </form>
              )}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {lastEvent?.photos_url ? (
              <Button asChild variant="outline" size="cta">
                <a href={lastEvent.photos_url} target="_blank" rel="noopener noreferrer nofollow">
                  <Camera className="mr-2 h-4 w-4" />
                  Revivre l&apos;édition 2026
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="cta">
              <Link href="/events/formats">Comprendre les formats</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </main>
  )
}
