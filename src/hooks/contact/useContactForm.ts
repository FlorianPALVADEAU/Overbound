'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSession } from '@/app/api/session/sessionQueries'

export const CONTACT_SUBJECTS = [
  'Inscription ou billet',
  'Partenariat ou presse',
  'Bénévolat',
  'Autre',
] as const

export const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png'
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const lastSubmissionKey = (userId: string) => `overbound-contact-last-submission-${userId}`

export function useContactForm() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const userId = session?.user?.id ?? null

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    subject: CONTACT_SUBJECTS[0] as string,
    message: '',
  })
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSubmissionDate, setLastSubmissionDate] = useState<string | null>(null)

  const todayKey = new Date().toISOString().slice(0, 10)
  const alreadySentToday = !!userId && lastSubmissionDate === todayKey

  useEffect(() => {
    if (!userId) return
    setLastSubmissionDate(window.localStorage.getItem(lastSubmissionKey(userId)))
  }, [userId])

  useEffect(() => {
    if (!session) return
    setValues((prev) => ({
      ...prev,
      fullName:
        prev.fullName || session.profile?.full_name || session.user?.user_metadata?.full_name || '',
      email: prev.email || session.user?.email || '',
    }))
  }, [session])

  const setField =
    (field: 'fullName' | 'email' | 'message') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSent(false)
      setError(null)
      const { value } = event.target
      setValues((prev) => ({ ...prev, [field]: value }))
    }

  const setSubject = (subject: string) => {
    setSent(false)
    setError(null)
    setValues((prev) => ({ ...prev, subject }))
  }

  const pickAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAttachmentError('Fichier trop volumineux (2 Mo maximum).')
      setAttachment(null)
    } else if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      setAttachmentError('Format non supporté. Utilise un PDF, JPG ou PNG.')
      setAttachment(null)
    } else {
      setAttachmentError(null)
      setAttachment(file)
    }
  }

  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentError(null)
  }

  const markSubmittedToday = () => {
    if (!userId) return
    window.localStorage.setItem(lastSubmissionKey(userId), todayKey)
    setLastSubmissionDate(todayKey)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSent(false)

    if (!userId) return
    if (alreadySentToday) {
      setError('Tu as déjà envoyé une demande aujourd’hui. Réessaie demain.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('fullName', values.fullName)
      formData.append('email', values.email)
      formData.append('reason', values.subject)
      formData.append('message', values.message)
      if (attachment) formData.append('dossier', attachment)

      const response = await fetch('/api/contact', { method: 'POST', body: formData })
      const data = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        const message = data.error ?? 'Impossible d’envoyer ta demande pour le moment.'
        setError(message)
        if (response.status === 400 && /fichier|format/i.test(message)) {
          setAttachmentError(message)
          setAttachment(null)
        }
        if (response.status === 429) markSubmittedToday()
        return
      }

      markSubmittedToday()
      setSent(true)
      setAttachment(null)
      setAttachmentError(null)
      setValues((prev) => ({ ...prev, message: '' }))
    } catch {
      setError('Impossible d’envoyer ta demande pour le moment. Réessaie dans quelques minutes.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    values.fullName.trim() !== '' &&
    values.email.trim() !== '' &&
    values.message.trim() !== '' &&
    !alreadySentToday &&
    !submitting

  return {
    values,
    userId,
    sessionLoading,
    attachment,
    attachmentError,
    error,
    sent,
    submitting,
    alreadySentToday,
    canSubmit,
    setField,
    setSubject,
    pickAttachment,
    removeAttachment,
    submit,
  }
}
