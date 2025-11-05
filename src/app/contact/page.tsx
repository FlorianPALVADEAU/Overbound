'use client'

import Link from 'next/link'
import {
  Clock3,
  Facebook,
  FileText,
  Instagram,
  LifeBuoy,
  Linkedin,
  Mail,
  MapPin,
  ShieldCheck,
  Twitter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSession } from '@/app/api/session/sessionQueries'

const supportChannels = [
  {
    title: 'Support par e-mail',
    description: 'Nous répondons sous 24 h (48 h en période de course)',
    icon: Mail,
    cta: {
      label: 'Écrire au support',
      href: 'mailto:contact@overbound-race.com',
      variant: 'outline' as const,
    },
    extra: 'contact@overbound-race.com',
    highlight: 'Réponse prioritaire pour les dossiers complets',
  },
  {
    title: 'Formulaire de contact',
    description: 'Explique ton besoin et joins des documents en quelques clics.',
    icon: FileText,
    cta: {
      label: 'Ouvrir le formulaire',
      href: '#contact-form',
      variant: 'default' as const,
    },
    highlight: 'Traitement par ordre d’urgence déclaré',
  },
]

const contactReasons = [
  {
    title: 'Modifier mon inscription',
    description: 'Changement de dossard, transfert de billet, mise à jour des informations.',
    href: '#support-inscription',
  },
  {
    title: 'Envoyer mes documents',
    description: 'Certificat médical, autorisation parentale, pièces manquantes.',
    href: '#support-documents',
  },
  {
    title: 'Joindre l’équipe médias',
    description: 'Demandes presse, partenariats, shootings photos.',
    href: '#support-presse',
  },
  {
    title: 'Rejoindre la team bénévoles',
    description: 'Inscription obstacle crew, volontariat en zone village.',
    href: '#support-benevoles',
  },
]

const socialLinks = [
  { name: 'Instagram', href: 'https://instagram.com/overbound', icon: Instagram },
  { name: 'Facebook', href: 'https://facebook.com/overbound', icon: Facebook },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/overbound', icon: Linkedin },
  { name: 'X (Twitter)', href: 'https://twitter.com/overbound', icon: Twitter },
]

const contactFormSteps = [
  {
    title: 'Choisis ta catégorie',
    description: 'Indique le motif de contact pour orienter ton message vers la bonne équipe.',
  },
  {
    title: 'Complète tes informations',
    description: 'Ajoute tes coordonnées et, si besoin, référence de billet afin d’accélérer le traitement.',
  },
  {
    title: 'Joins des fichiers',
    description: 'Certificat médical, justificatif… le formulaire accepte les pièces nécessaires à ton dossier.',
  },
]

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png'
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const ContactPage = () => {
  const { data: session, isLoading: sessionLoading } = useSession()
  const userId = session?.user?.id ?? null
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    reason: '',
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [lastSubmissionDate, setLastSubmissionDate] = useState<string | null>(null)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!userId) {
      setLastSubmissionDate(null)
      return
    }
    const stored = window.localStorage.getItem(`overbound-contact-last-submission-${userId}`)
    setLastSubmissionDate(stored)
  }, [userId])

  useEffect(() => {
    if (!session) return
    setFormValues((prev) => ({
      ...prev,
      fullName:
        prev.fullName ||
        session.profile?.full_name ||
        session.user?.user_metadata?.full_name ||
        '',
      email: prev.email || session.user?.email || '',
    }))
  }, [session])

  const todayKey = new Date().toISOString().slice(0, 10)
  const hasSubmittedToday = !!userId && lastSubmissionDate === todayKey

  const handleSelectReason = (reasonTitle: string) => {
    setSelectedReason(reasonTitle)
    setSubmissionError(null)
    setFormSubmitted(false)
    setFormValues((prev) => ({ ...prev, reason: reasonTitle }))
  }

  const handleInputChange =
    (field: 'fullName' | 'email' | 'reason' | 'message') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormSubmitted(false)
      setSubmissionError(null)
      const { value } = event.target
      setFormValues((prev) => ({ ...prev, [field]: value }))
    }

  const validateAttachment = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAttachmentError('Le fichier est trop volumineux (2 Mo maximum).')
      setAttachmentFile(null)
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const extAllowed = ALLOWED_EXTENSIONS.includes(extension)
    const mimeAllowed = file.type ? ALLOWED_MIME_TYPES.includes(file.type) : false

    if (!extAllowed && !mimeAllowed) {
      setAttachmentError('Format non supporté. Utilise un PDF, JPG, JPEG ou PNG.')
      setAttachmentFile(null)
      return
    }

    setAttachmentError(null)
    setAttachmentFile(file)
  }

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      validateAttachment(file)
    } else {
      setAttachmentFile(null)
    }
    event.target.value = ''
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    setAttachmentError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmissionError(null)
    setFormSubmitted(false)

    const todayKey = new Date().toISOString().slice(0, 10)

    if (!userId) {
      setSubmissionError('Connecte-toi à ton compte pour nous écrire via le formulaire.')
      return
    }

    if (hasSubmittedToday) {
      setSubmissionError('Tu as déjà envoyé une demande aujourd’hui. Réessaie demain ou réponds à notre e-mail précédent.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('fullName', formValues.fullName)
      formData.append('email', formValues.email)
      formData.append('reason', formValues.reason)
      formData.append('message', formValues.message)
      if (attachmentFile) {
        formData.append('dossier', attachmentFile)
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage =
          (data as { error?: string }).error ?? 'Impossible d’envoyer ta demande actuellement.'
        setSubmissionError(errorMessage)
        if (
          response.status === 400 &&
          typeof errorMessage === 'string' &&
          /fichier|format/i.test(errorMessage)
        ) {
          setAttachmentError(errorMessage)
          setAttachmentFile(null)
        }
        if (response.status === 429 && typeof window !== 'undefined') {
          window.localStorage.setItem(`overbound-contact-last-submission-${userId}`, todayKey)
          setLastSubmissionDate(todayKey)
        }
        return
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`overbound-contact-last-submission-${userId}`, todayKey)
      }

      setFormSubmitted(true)
      setLastSubmissionDate(todayKey)
      setAttachmentFile(null)
      setAttachmentError(null)
    } catch (error) {
      console.error('[contact] failed to submit form', error)
      setSubmissionError('Impossible d’envoyer ta demande pour le moment. Réessaie dans quelques minutes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    formValues.fullName.trim().length > 0 &&
    formValues.email.trim().length > 0 &&
    formValues.message.trim().length > 0

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#f6f8f5] to-white">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#26AA26]/10 via-transparent to-transparent" />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-20 lg:py-24">
          <div className="flex-1 space-y-7 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#26AA26]/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-[#26AA26]">
              <LifeBuoy className="h-4 w-4" />
              Service support
            </span>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
              Parlons de ton expérience Overbound
            </h1>
            <p className="text-base leading-relaxed text-gray-600 sm:text-lg lg:max-w-xl">
              Notre tribu support t’accompagne avant, pendant et après ta course. Contacte-nous par e-mail ou via le
              formulaire dédié : chaque demande reçoit une réponse personnalisée.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                asChild
                className="h-12 rounded-full bg-[#26AA26] text-white hover:bg-[#1e8a1e]"
              >
                <Link href="#channels">Explorer les moyens de contact</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10"
              >
                <Link href="/about/faq">Consulter la FAQ</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-[#26AA26]" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Support prioritaire tribu</h2>
                <p className="text-sm text-gray-600">
                  Tu es inscrit sur un prochain Overbound ? Connecte-toi pour accéder à ton support prioritaire revendiqué.
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-2xl bg-[#26AA26]/5 p-4 text-sm text-[#1b5a1b]">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>E-mail : réponse garantie sous 24 h ouvrées</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Formulaire : suivi prioritaire avec pièces jointes</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5" />
                <span>Support renforcé les week-ends de course</span>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Important</p>
              <p>
                Les questions sur place sont traitées le jour J dès 6h par la tente accueil. Pense à venir avec ta pièce d’identité et une version imprimée de ton billet pour accélérer le contrôle.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="channels" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Choisis comment nous contacter</h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Toutes les demandes reçoivent une réponse personnalisée par un membre de la tribu support.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {supportChannels.map((channel) => (
            <div
              key={channel.title}
              className="flex h-full flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#26AA26]/40 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#26AA26]/10 text-[#26AA26]">
                  <channel.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{channel.title}</h3>
                  <p className="text-sm text-gray-600">{channel.description}</p>
                </div>
              </div>
              {channel.highlight ? (
                <span className="rounded-full bg-[#26AA26]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1b5a1b]">
                  {channel.highlight}
                </span>
              ) : null}
              {channel.extra ? <p className="text-sm font-medium text-gray-700">{channel.extra}</p> : null}
              <Button
                asChild
                variant={channel.cta.variant}
                className={cn(
                  'mt-auto h-11 rounded-full',
                  channel.cta.variant === 'outline'
                    ? 'border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10'
                    : 'bg-[#26AA26] text-white hover:bg-[#1e8a1e]',
                )}
              >
                <Link href={channel.cta.href}>{channel.cta.label}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6" id="support-inscription">
        <div className="flex flex-col gap-6 rounded-3xl border border-[#26AA26]/10 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 lg:flex-row lg:items-center lg:gap-10">
          <div className="flex-1 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#26AA26]">Gagne du temps</p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Tu sais déjà ce qui t’amène ?</h2>
            <p className="text-sm text-gray-600 sm:text-base">
              Sélectionne ci-dessous le motif de ta prise de contact et laisse-nous t’orienter vers la bonne équipe immédiatement.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {contactReasons.map((reason) => (
                <button
                  key={reason.title}
                  onClick={() => handleSelectReason(reason.title)}
                  className={cn(
                    'rounded-2xl border bg-white px-4 py-3 text-left transition',
                    selectedReason === reason.title
                      ? 'border-[#26AA26] bg-[#26AA26]/5 text-[#145814]'
                      : 'border-gray-100 text-gray-600 hover:border-[#26AA26]/40 hover:bg-[#26AA26]/5',
                  )}
                >
                  <p className="text-sm font-semibold text-current">{reason.title}</p>
                  <p className="text-xs text-gray-500">{reason.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Que préfères-tu faire ?</h3>
            <ul className="mt-3 space-y-3 text-sm text-gray-600">
              <li>• Envoyer un e-mail détaillé pour une réponse sous 24 h</li>
              <li>• Remplir le formulaire en ligne et ajouter des pièces jointes</li>
              <li>• Parcourir la FAQ pour les questions les plus fréquentes</li>
            </ul>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-full bg-[#26AA26] text-white hover:bg-[#1e8a1e]">
                <Link href="#channels">Contacter le support</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10"
              >
                <Link href="/about/faq">Consulter la FAQ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="contact-form" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-[#26AA26]/10 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Comment utiliser notre formulaire ?</h2>
                <span className="rounded-full bg-[#26AA26]/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#1b5a1b]">
                  Traitement sous 24 h ouvrées
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {contactFormSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600 shadow-sm transition hover:border-[#26AA26]/40 hover:shadow-md"
                  >
                    <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#26AA26]/10 text-sm font-semibold text-[#26AA26]">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-xs text-gray-500 sm:text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-[#26AA26]/40 bg-[#26AA26]/5 p-5 text-sm text-[#1b5a1b]">
                <p className="font-semibold">Pendant les événements</p>
                <p>
                  Notre équipe suit toutes les demandes e-mail et formulaire en temps réel. Pense simplement à indiquer ton numéro de dossard ou la vague concernée pour que nous te répondions encore plus vite.
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Formulaire de contact</h3>
              <p className="mt-2 text-sm text-gray-600">
                Nous recevons ton message directement dans la boîte contact@overbound-race.com. Tu pourras compléter ton e-mail si tu dois joindre des documents.
              </p>

              {sessionLoading ? (
                <div className="mt-6 space-y-3">
                  <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-32 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-11 w-full animate-pulse rounded-full bg-gray-100" />
                </div>
              ) : session?.user ? (
                <>
                  {hasSubmittedToday ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-[#26AA26]/40 bg-[#26AA26]/10 p-4 text-sm text-[#1b5a1b]">
                      <p className="font-semibold">Tu as déjà envoyé un message aujourd’hui.</p>
                      <p className="mt-1">
                        Réponds à notre dernier e-mail pour donner plus de détails, ou reviens demain pour ouvrir une nouvelle demande.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-gray-600">
                      Tu peux soumettre une demande par jour afin que notre équipe traite chaque dossier avec la meilleure attention.
                    </p>
                  )}

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-semibold text-gray-800">
                        Nom complet
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        required
                        disabled={hasSubmittedToday}
                        value={formValues.fullName}
                        onChange={handleInputChange('fullName')}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#26AA26] focus:ring-2 focus:ring-[#26AA26]/30 disabled:cursor-not-allowed disabled:bg-gray-100"
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-semibold text-gray-800">
                        Adresse e-mail
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={hasSubmittedToday}
                        value={formValues.email}
                        onChange={handleInputChange('email')}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#26AA26] focus:ring-2 focus:ring-[#26AA26]/30 disabled:cursor-not-allowed disabled:bg-gray-100"
                        placeholder="prenom@overbound.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="reason" className="text-sm font-semibold text-gray-800">
                        Motif de contact
                      </label>
                      <input
                        id="reason"
                        name="reason"
                        type="text"
                        disabled={hasSubmittedToday}
                        value={formValues.reason}
                        onChange={handleInputChange('reason')}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#26AA26] focus:ring-2 focus:ring-[#26AA26]/30 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="Ex : Modifier mon inscription"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Ton dossier (optionnel) · PDF, JPG, PNG · 2 Mo max
                  </label>
                  <div
                    className={cn(
                      'rounded-2xl border border-dashed bg-white/80 p-4 text-sm transition',
                      attachmentFile ? 'border-[#26AA26]' : 'border-gray-200 hover:border-[#26AA26]/60',
                      (hasSubmittedToday || isSubmitting) && 'pointer-events-none opacity-70',
                    )}
                  >
                    {attachmentFile ? (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{attachmentFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachmentFile.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10"
                          onClick={removeAttachment}
                        >
                          Retirer
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-600">
                          Ajoute ton certificat, ton justificatif ou tout document utile à ta demande.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10"
                          onClick={() => {
                            if (hasSubmittedToday || isSubmitting) return
                            fileInputRef.current?.click()
                          }}
                        >
                          Joindre un fichier
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_FILE_TYPES}
                      className="hidden"
                      onChange={handleAttachmentChange}
                      disabled={hasSubmittedToday || isSubmitting}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Formats acceptés : PDF, JPG, JPEG, PNG · Taille maximale&nbsp;: 2&nbsp;Mo.
                    </p>
                    {attachmentError ? <p className="text-xs text-red-500">{attachmentError}</p> : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-gray-800">
                    Ton message
                  </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        disabled={hasSubmittedToday}
                        value={formValues.message}
                        onChange={handleInputChange('message')}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#26AA26] focus:ring-2 focus:ring-[#26AA26]/30 disabled:cursor-not-allowed disabled:bg-gray-100"
                        placeholder="Donne-nous un maximum d’informations pour que l’on puisse t’aider rapidement."
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!isFormValid || hasSubmittedToday || isSubmitting}
                      className="h-11 w-full rounded-full bg-[#26AA26] text-white transition hover:bg-[#1e8a1e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'Envoi en cours…' : 'Envoyer mon message'}
                    </Button>
                    {submissionError ? <p className="text-sm text-red-500">{submissionError}</p> : null}
                    {formSubmitted ? (
                      <p className="text-sm text-[#1b5a1b]">
                        Merci ! Ta demande a bien été transmise à notre équipe support. Nous te répondrons par e-mail sous 24&nbsp;h ouvrées.
                      </p>
                    ) : null}
                  </form>
                </>
              ) : (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-gray-600">
                    Tu dois être connecté à ton compte Overbound pour utiliser le formulaire sécurisé et suivre l’historique de tes échanges.
                  </p>
                  <Button
                    asChild
                    className="h-11 w-full rounded-full bg-[#26AA26] text-white transition hover:bg-[#1e8a1e]"
                  >
                    <Link href={`/auth/login?next=${encodeURIComponent('/contact')}`}>Se connecter</Link>
                  </Button>
                  <p className="text-xs text-gray-500">
                    Tu peux aussi nous écrire directement à{' '}
                    <Link href="mailto:contact@overbound-race.com" className="text-[#26AA26] underline">
                      contact@overbound-race.com
                    </Link>{' '}
                    depuis l’adresse associée à ton compte.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6" id="support-documents">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#26AA26]/10 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Adresse du siège</h2>
            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#26AA26]" />
                <p>
                  Overbound HQ<br />23 avenue des Cimes, Bâtiment A<br />69009 Lyon · France
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Clock3 className="h-4 w-4 text-[#26AA26]" />
                <p>Accueil physiques sur rendez-vous uniquement (du lundi au vendredi)</p>
              </div>
              <Link
                href="https://maps.google.com/?q=23+avenue+des+Cimes+69009+Lyon"
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#26AA26] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#26AA26] transition hover:bg-[#26AA26]/10"
              >
                Voir sur Google Maps
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-[#26AA26]/10 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8" id="support-presse">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Relations médias & partenaires</h2>
            <p className="mt-3 text-sm text-gray-600 sm:text-base">
              Tu es journaliste, créateur de contenu ou responsable partenariat ? Contacte notre équipe dédiée :
            </p>
            <div className="mt-4 grid gap-3 text-sm text-gray-600">
              <p>
                <span className="font-semibold text-gray-900">Relations presse :</span>{' '}
                <Link href="mailto:presse@overbound-race.com" className="text-[#26AA26] underline">
                  presse@overbound-race.com
                </Link>
              </p>
              <p>
                <span className="font-semibold text-gray-900">Invitations média :</span>{' '}
                <Link href="mailto:media@overbound-race.com" className="text-[#26AA26] underline">
                  media@overbound-race.com
                </Link>
              </p>
              <p>
                <span className="font-semibold text-gray-900">Partenariats marques :</span>{' '}
                <Link href="mailto:partenariats@overbound-race.com" className="text-[#26AA26] underline">
                  partenariats@overbound-race.com
                </Link>
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:border-[#26AA26] hover:bg-[#26AA26]/10 hover:text-[#26AA26]"
                >
                  <social.icon className="h-4 w-4" />
                  {social.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="support-benevoles" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-[#26AA26]/10 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#26AA26]">Rejoindre la tribu</p>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Envie de devenir obstacle crew ?</h2>
              <p className="mt-2 text-sm text-gray-600 sm:text-base">
                Chaque course Overbound repose sur l’énergie de ses bénévoles. Hébergement, repas et tenue fournis — et bien sûr, une place offerte sur l’événement de ton choix.
              </p>
            </div>
            <Button
              asChild
              className="h-12 rounded-full bg-[#26AA26] text-white hover:bg-[#1e8a1e]"
            >
              <Link href="/volunteers">Découvrir le programme bénévoles</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#0f1b12] py-12 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#26AA26]">Overbound Support</p>
            <h3 className="text-2xl font-bold">On se parle bientôt ?</h3>
            <p className="text-sm text-white/70 sm:text-base">
              Tu trouveras toujours un membre de la tribu prêt à t’aider, que ce soit pour ta première course ou ta cinquième.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="h-12 rounded-full border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10">
              <Link href="mailto:contact@overbound-race.com">Écrire au support</Link>
            </Button>
            <Button asChild className="h-12 rounded-full bg-[#26AA26] text-white hover:bg-[#1e8a1e]">
              <Link href="/events">Voir les prochains événements</Link>
            </Button>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default ContactPage
