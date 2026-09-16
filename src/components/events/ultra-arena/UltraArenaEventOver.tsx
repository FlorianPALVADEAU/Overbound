'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Instagram, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  formattedDate: string
  location: string
  notifyEmail: string
  notifyStatus: 'idle' | 'loading' | 'success' | 'error'
  notifyMessage: string | null
  onNotifyEmailChange: (value: string) => void
  onNotifySubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function UltraArenaEventOver({
  formattedDate,
  location,
  notifyEmail,
  notifyStatus,
  notifyMessage,
  onNotifyEmailChange,
  onNotifySubmit,
}: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            src="/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif"
            alt="Ultra Arena — édition passée Overbound"
            className="h-full w-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/40 via-background/90 to-background" />
        </div>

        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full border border-border/60 bg-background/75 px-5 text-muted-foreground backdrop-blur hover:bg-background/90 hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Ultra Arena 2026
          </p>

          <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl">
            Merci d'avoir été aussi nombreux à repousser vos limites.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            L'édition {formattedDate} à {location} est terminée et les inscriptions sont closes.
            On prépare déjà la suite — et on revient encore plus fort pour la prochaine édition.
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <Button
              asChild
              size="lg"
              className="h-14 w-full rounded-2xl px-8 text-base font-bold shadow-lg shadow-primary/20"
            >
              <a
                href="https://photo.capture-ai.fr/events/overbound-2026"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <Camera className="mr-2 h-5 w-5" />
                Revivre l'édition en photos
              </a>
            </Button>
          </div>

          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur">
            {!showForm ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-semibold">
                  Sois prévenu·e en premier de l'ouverture de la prochaine édition
                </p>
                <Button size="lg" className="h-12 w-full rounded-xl text-base font-bold" onClick={() => setShowForm(true)}>
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
                  required
                  placeholder="ton@email.com"
                  value={notifyEmail}
                  onChange={(e) => onNotifyEmailChange(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-xl text-base font-bold"
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
              className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-foreground"
            >
              <Instagram className="h-4 w-4" />
              Suivre sur Instagram
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
