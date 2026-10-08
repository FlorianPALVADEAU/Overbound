'use client'

import Link from 'next/link'
import { Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  ACCEPTED_FILE_TYPES,
  CONTACT_SUBJECTS,
  formatFileSize,
  useContactForm,
} from '@/hooks/contact/useContactForm'

export function ContactForm() {
  const form = useContactForm()
  const locked = form.alreadySentToday || form.submitting

  if (form.sessionLoading) {
    return <div className="min-h-96" aria-busy="true" />
  }

  if (!form.userId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-black tracking-tight">Connecte-toi pour nous écrire</h2>
        <p className="max-w-prose text-foreground/80">
          Le formulaire est réservé aux comptes Overbound. Tu peux aussi nous écrire directement à{' '}
          <a href="mailto:contact@overbound-race.com" className="font-semibold text-primary underline">
            contact@overbound-race.com
          </a>
          .
        </p>
        <Button asChild size="lg" className="min-h-11">
          <Link href={`/auth/login?next=${encodeURIComponent('/contact')}`}>Se connecter</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={form.submit} className="space-y-8">
      <fieldset className="space-y-3" disabled={locked}>
        <legend className="text-sm font-semibold">Ton sujet</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_SUBJECTS.map((subject) => {
            const active = form.values.subject === subject
            return (
              <label
                key={subject}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors',
                  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-foreground/80 hover:border-primary/60',
                )}
              >
                <input
                  type="radio"
                  name="subject"
                  value={subject}
                  checked={active}
                  onChange={() => form.setSubject(subject)}
                  className="sr-only"
                />
                {subject}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            disabled={locked}
            value={form.values.fullName}
            onChange={form.setField('fullName')}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={locked}
            value={form.values.email}
            onChange={form.setField('email')}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          disabled={locked}
          value={form.values.message}
          onChange={form.setField('message')}
          placeholder="Plus tu donnes de détails (numéro de commande, course concernée), plus on répond vite."
        />
      </div>

      <div className="space-y-2">
        {form.attachment ? (
          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
            <span className="min-w-0 truncate">
              {form.attachment.name}{' '}
              <span className="text-muted-foreground">({formatFileSize(form.attachment.size)})</span>
            </span>
            <button
              type="button"
              onClick={form.removeAttachment}
              aria-label="Retirer la pièce jointe"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            className={cn(
              'inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline',
              locked && 'pointer-events-none opacity-60',
            )}
          >
            <Paperclip className="size-4" />
            Joindre un document (PDF, JPG ou PNG, 2 Mo max)
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={form.pickAttachment}
              disabled={locked}
              className="sr-only"
            />
          </label>
        )}
        {form.attachmentError ? <p className="text-sm text-destructive">{form.attachmentError}</p> : null}
      </div>

      <div className="space-y-4">

        <Button type="submit" size="lg" className="min-h-11 w-full sm:w-auto" disabled={!form.canSubmit}>
          {form.submitting ? 'Envoi…' : 'Envoyer'}
        </Button>

        <div aria-live="polite">
          {form.sent ? (
            <p className="text-sm font-medium text-primary">
              Message envoyé. On te répond dans les plus brefs délais, par e-mail.
            </p>
          ) : null}
          {form.alreadySentToday && !form.sent ? (
            <p className="text-sm text-muted-foreground">Tu as déjà écrit aujourd’hui. Réessaie demain.</p>
          ) : null}
          {form.error ? <p className="text-sm text-destructive">{form.error}</p> : null}
        </div>
      </div>
    </form>
  )
}
