'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Instagram, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Container, Section, DISPLAY_TITLE, Eyebrow } from '@/components/ds'
import { cn } from '@/lib/utils'

interface Props {
  eventTitle: string
  formattedDate: string
  location: string
  photosUrl: string | null
  notifyEmail: string
  notifyStatus: 'idle' | 'loading' | 'success' | 'error'
  notifyMessage: string | null
  onNotifyEmailChange: (value: string) => void
  onNotifySubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function UltraArenaEventOver({
  eventTitle,
  formattedDate,
  location,
  photosUrl,
  notifyEmail,
  notifyStatus,
  notifyMessage,
  onNotifyEmailChange,
  onNotifySubmit,
}: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Section spacing="spacious">
        <div className="absolute inset-0">
          <img
            src="/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.webp"
            alt="Ultra Arena — édition passée Overbound"
            className="h-full w-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/40 via-background/90 to-background" />
        </div>

        <Container size="prose" className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="min-h-11 rounded-full border border-border/60 bg-background/75 px-5 text-muted-foreground backdrop-blur hover:bg-background/90 hover:text-foreground"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>

          <Eyebrow>{eventTitle}</Eyebrow>

          <h1 className={cn(DISPLAY_TITLE, 'mt-6 text-display-lg')}>
            Merci d'avoir été aussi nombreux à repousser vos limites.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lead text-muted-foreground">
            L'édition {formattedDate} à {location} est terminée et les inscriptions sont closes.
            On prépare déjà la suite — et on revient encore plus fort pour la prochaine édition.
          </p>

          {photosUrl ? (
            <div className="mx-auto mt-8 max-w-md">
              <Button
                asChild
                size="hero"
                className="w-full shadow-lg shadow-primary/20"
              >
                <a href={photosUrl} target="_blank" rel="noopener noreferrer nofollow">
                  <Camera className="mr-2 h-5 w-5" />
                  Revivre l'édition en photos
                </a>
              </Button>
            </div>
          ) : null}

          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur">
            {!showForm ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-semibold">
                  Sois prévenu·e en premier de l'ouverture de la prochaine édition
                </p>
                <Button size="cta" className="w-full" onClick={() => setShowForm(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Être prévenu·e
                </Button>
              </div>
            ) : notifyStatus === 'success' ? (
              <p className="text-sm font-semibold text-primary">{notifyMessage}</p>
            ) : (
              <form onSubmit={onNotifySubmit} className="flex flex-col gap-3">
                <p className="text-sm font-semibold">
                  Laisse ton email, on te préviendra dès l'ouverture des prochaines inscriptions.
                </p>
                <Input
                  type="email"
                  aria-label="Ton adresse email"
                  required
                  placeholder="ton@email.com"
                  value={notifyEmail}
                  onChange={(e) => onNotifyEmailChange(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
                <Button
                  type="submit"
                  size="cta"
                  className="w-full"
                  disabled={notifyStatus === 'loading'}
                >
                  {notifyStatus === 'loading' ? 'Envoi…' : 'Me prévenir'}
                </Button>
                {notifyStatus === 'error' && notifyMessage ? (
                  <p className="text-sm text-destructive">{notifyMessage}</p>
                ) : null}
              </form>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://www.instagram.com/overbound.race/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex min-h-11 items-center gap-1.5 underline underline-offset-4 hover:text-foreground"
            >
              <Instagram className="h-4 w-4" />
              Suivre sur Instagram
            </a>
          </div>
        </Container>
      </Section>
    </main>
  )
}
