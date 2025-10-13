'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gift,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldAlert,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { Upsell, UpsellOptions } from '@/types/Upsell'
import type { PromotionalCode } from '@/types/PromotionalCode'
import SignaturePad from '@/components/forms/SignaturePad'
import { REGULATION_VERSION } from '@/constants/registration'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import type { RegistrationSummary, RegistrationDraft } from '@/store/useRegistrationStore'

interface EventTicket extends Ticket {
  race?: Ticket['race'] & {
    type?: string | null
    target_public?: string | null
    description?: string | null
    obstacles?: Array<{
      order_position: number
      is_mandatory: boolean
      obstacle: {
        id: string
        name: string
      }
    }>
  }
}

type EventUser = {
  id: string
  email: string
  fullName?: string | null
  date_of_birth?: string | null
}

type EventUpsell = Upsell & {
  options?: UpsellOptions | null
}

const DEFAULT_TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const resolveUpsellSizes = (upsell: EventUpsell) => {
  const sizes = upsell.options?.sizes
  return sizes && sizes.length > 0 ? sizes : DEFAULT_TSHIRT_SIZES
}

const extractTshirtSizes = (meta?: Record<string, any>): string[] => {
  if (!meta) return []
  if (Array.isArray(meta.sizes)) {
    return meta.sizes.filter((size): size is string => typeof size === 'string' && size.length > 0)
  }
  if (typeof meta.size === 'string' && meta.size.trim().length > 0) {
    return [meta.size]
  }
  return []
}

const normalizeTshirtSizes = (
  meta: Record<string, any> | undefined,
  quantity: number,
  availableSizes: string[],
): string[] => {
  if (quantity <= 0) return []
  const fallback = availableSizes[0] ?? DEFAULT_TSHIRT_SIZES[0]
  const initial = extractTshirtSizes(meta)
  const normalized = initial
    .slice(0, quantity)
    .map((size) => (availableSizes.includes(size) ? size : fallback))

  const result = [...normalized]
  while (result.length < quantity) {
    result.push(fallback)
  }

  if (result.length > quantity) {
    return result.slice(0, quantity)
  }

  return result
}

const buildTshirtMeta = (
  meta: Record<string, any> | undefined,
  quantity: number,
  availableSizes: string[],
): Record<string, any> => {
  if (quantity <= 0) {
    return {}
  }
  const sizes = normalizeTshirtSizes(meta, quantity, availableSizes)
  const baseMeta = { ...(meta || {}) }
  delete baseMeta.size
  return {
    ...baseMeta,
    sizes,
  }
}

type StepKey = 'tickets' | 'participants' | 'options' | 'confirmation'

type Participant = {
  id: string
  ticketId: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalInfo: string
  licenseNumber: string
}

type SelectedUpsellState = Record<string, { quantity: number; meta?: Record<string, any> }>

type TicketSelections = Record<string, number>

type AppliedPromo = Pick<
  PromotionalCode,
  | 'id'
  | 'code'
  | 'description'
  | 'discount_percent'
  | 'discount_amount'
  | 'currency'
>

export interface MultiStepEventRegistrationProps {
  event: Event
  tickets: EventTicket[]
  upsells: EventUpsell[]
  user: EventUser | null
  availableSpots: number
  initialTicketId?: string | null
}

interface PricingSummary {
  ticketTotal: number
  upsellTotal: number
  discountAmount: number
  totalDue: number
  currency: string
}

const steps: Array<{ id: StepKey; title: string; description: string }> = [
  {
    id: 'tickets',
    title: 'Billets',
    description: 'Choisissez les formats et quantités souhaités.',
  },
  {
    id: 'participants',
    title: 'Participants',
    description: 'Renseignez les informations pour chaque coureur.',
  },
  {
    id: 'options',
    title: 'Options',
    description: 'Ajoutez des extras et des codes promotionnels.',
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    description: 'Validez la décharge et procédez au paiement.',
  },
]

const formatPrice = (valueInCents: number, currency: string) => {
  return (valueInCents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}

const calculatePromoDiscount = (
  promo: AppliedPromo | null,
  ticketSubtotal: number,
): number => {
  if (!promo || ticketSubtotal <= 0) return 0

  if (promo.discount_percent && promo.discount_percent > 0) {
    return Math.min(ticketSubtotal, Math.round(ticketSubtotal * (promo.discount_percent / 100)))
  }

  if (promo.discount_amount && promo.discount_amount > 0) {
    return Math.min(ticketSubtotal, promo.discount_amount)
  }

  return 0
}

const joinName = (first: string, last: string) => `${first.trim()} ${last.trim()}`.trim()

export default function MultiStepEventRegistration({
  event,
  tickets,
  upsells,
  user,
  availableSpots,
  initialTicketId = null,
}: MultiStepEventRegistrationProps) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [ticketSelections, setTicketSelections] = useState<TicketSelections>({})
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedUpsells, setSelectedUpsells] = useState<SelectedUpsellState>({})
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [disclaimerRead, setDisclaimerRead] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [pricing, setPricing] = useState<PricingSummary | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const initializationKeyRef = useRef<string | null>(null)

  const registrationDraft = useRegistrationStore((state) => state.draft)
  const setRegistrationDraft = useRegistrationStore((state) => state.setDraft)
  const clearRegistrationDraft = useRegistrationStore((state) => state.clear)
  const registrationHasHydrated = useRegistrationStore((state) => state.hasHydrated)
  const lastSavedDraftRef = useRef<string | null>(null)

  const defaultCurrency = useMemo(() => {
    const firstTicketCurrency = tickets.find((ticket) => ticket.currency)?.currency
    return (firstTicketCurrency || 'eur').toLowerCase()
  }, [tickets])

  useEffect(() => {
    if (!registrationHasHydrated) {
      return
    }

    const key = `${event.id}-${initialTicketId ?? ''}`

    if (initializationKeyRef.current !== key) {
      initializationKeyRef.current = key

      if (registrationDraft && registrationDraft.eventId === event.id) {
        const selectionRecord: TicketSelections = {}
        registrationDraft.ticketSelections.forEach((selection) => {
          if (selection.quantity > 0) {
            selectionRecord[selection.ticketId] = selection.quantity
          }
        })
        setTicketSelections(selectionRecord)

        setParticipants(
          registrationDraft.participants.map((participant) => ({
            ...participant,
          })),
        )

        const upsellRecord: SelectedUpsellState = {}
        registrationDraft.upsells.forEach((item) => {
          upsellRecord[item.upsellId] = {
            quantity: item.quantity,
            meta: item.meta || {},
          }
        })
        setSelectedUpsells(upsellRecord)

        if (registrationDraft.promoCode) {
          setAppliedPromo({
            id: registrationDraft.promoCode,
            code: registrationDraft.promoCode,
            description: '',
            discount_percent: null,
            discount_amount: null,
            currency: registrationDraft.summary.currency as any,
          })
          setPromoInput(registrationDraft.promoCode)
        } else {
          setAppliedPromo(null)
          setPromoInput('')
        }

        setPromoError(null)
        setDisclaimerRead(registrationDraft.disclaimer.read)
        setDisclaimerAccepted(registrationDraft.disclaimer.accepted)
        setSignatureImage(registrationDraft.signature.imageDataUrl)
        setClientSecret(registrationDraft.clientSecret)
        setPaymentIntentId(registrationDraft.paymentIntentId)
        setPricing(registrationDraft.summary)
        setStepIndex(0)
        setSubmissionMessage(null)
        return
      }

      setStepIndex(0)
      setSubmissionMessage(null)

      if (initialTicketId && tickets.some((ticket) => ticket.id === initialTicketId)) {
        setTicketSelections({ [initialTicketId]: 1 })
      } else if (tickets.length === 1) {
        setTicketSelections({ [tickets[0].id]: 1 })
      } else {
        setTicketSelections({})
      }

      setParticipants([])
      setSelectedUpsells({})
      setAppliedPromo(null)
      setPromoInput('')
      setPromoError(null)
      setDisclaimerRead(false)
      setDisclaimerAccepted(false)
      setSignatureImage(null)
      setClientSecret(null)
      setPaymentIntentId(null)
      setPricing(null)
    }
  }, [registrationHasHydrated, registrationDraft, event.id, initialTicketId, tickets])

  const ticketMap = useMemo(() => {
    return Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket])) as Record<string, EventTicket>
  }, [tickets])

  const selectedTicketSlots = useMemo(() => {
    const slots: string[] = []
    Object.entries(ticketSelections).forEach(([ticketId, quantity]) => {
      for (let index = 0; index < quantity; index += 1) {
        slots.push(ticketId)
      }
    })
    return slots
  }, [ticketSelections])

  const totalParticipants = selectedTicketSlots.length

  useEffect(() => {
    setParticipants((previous) => {
      if (selectedTicketSlots.length === 0) return []

      let next = previous.slice(0, selectedTicketSlots.length)

      if (next.length < selectedTicketSlots.length) {
        const startIndex = next.length
        const newParticipants = selectedTicketSlots
          .slice(startIndex)
          .map((ticketId, index) => ({
            id: `participant-${startIndex + index + 1}`,
            ticketId,
            firstName: '',
            lastName: '',
            email: index === 0 && user?.email ? user.email : '',
            birthDate: index === 0 && user?.date_of_birth ? user.date_of_birth : '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            medicalInfo: '',
            licenseNumber: '',
          }))
        next = [...next, ...newParticipants]
      } else {
        next = next.map((participant, index) => ({
          ...participant,
          ticketId: selectedTicketSlots[index] ?? participant.ticketId,
        }))
      }

      return next
    })

    setClientSecret(null)
    setPaymentIntentId(null)
    setPricing(null)
  }, [selectedTicketSlots, user?.email])

  useEffect(() => {
    setSelectedUpsells((previous) => {
      if (upsells.length === 0) {
        return previous
      }

      let hasChanges = false
      const nextState: SelectedUpsellState = { ...previous }
      const maxPerTicket = selectedTicketSlots.length

      upsells.forEach((upsell) => {
        if (upsell.type !== 'tshirt') {
          return
        }

        const entry = nextState[upsell.id]
        if (!entry) {
          return
        }

        const availableSizes = resolveUpsellSizes(upsell)
        const allowedQuantity = Math.min(entry.quantity, maxPerTicket)

        if (allowedQuantity <= 0) {
          delete nextState[upsell.id]
          hasChanges = true
          return
        }

        const normalizedMeta = buildTshirtMeta(entry.meta, allowedQuantity, availableSizes)
        const metaChanged = JSON.stringify(entry.meta ?? {}) !== JSON.stringify(normalizedMeta)

        if (entry.quantity !== allowedQuantity || metaChanged) {
          nextState[upsell.id] = {
            quantity: allowedQuantity,
            ...(Object.keys(normalizedMeta).length > 0 ? { meta: normalizedMeta } : {}),
          }
          hasChanges = true
        }
      })

      return hasChanges ? nextState : previous
    })
  }, [selectedTicketSlots.length, upsells])

  const ticketSubtotal = useMemo(() => {
    return selectedTicketSlots.reduce((accumulator, ticketId) => {
      const ticket = ticketMap[ticketId]
      if (!ticket || !ticket.base_price_cents) return accumulator
      return accumulator + ticket.base_price_cents
    }, 0)
  }, [selectedTicketSlots, ticketMap])

  const upsellSubtotal = useMemo(() => {
    return Object.entries(selectedUpsells).reduce((accumulator, [upsellId, config]) => {
      const upsell = upsells.find((item) => item.id === upsellId)
      if (!upsell) return accumulator
      return accumulator + config.quantity * upsell.price_cents
    }, 0)
  }, [selectedUpsells, upsells])

  const discountAmount = useMemo(() => calculatePromoDiscount(appliedPromo, ticketSubtotal), [appliedPromo, ticketSubtotal])

  const totalDue = useMemo(() => Math.max(ticketSubtotal + upsellSubtotal - discountAmount, 0), [ticketSubtotal, upsellSubtotal, discountAmount])

  const computedPricing: PricingSummary = useMemo(() => ({
    ticketTotal: ticketSubtotal,
    upsellTotal: upsellSubtotal,
    discountAmount,
    totalDue,
    currency: defaultCurrency,
  }), [defaultCurrency, discountAmount, ticketSubtotal, totalDue, upsellSubtotal])

  const summaryPricing = pricing ?? computedPricing

  useEffect(() => {
    if (!registrationHasHydrated) {
      return
    }

    if (!user) {
      clearRegistrationDraft()
      lastSavedDraftRef.current = null
      return
    }

    const ticketSelectionArray = Object.entries(ticketSelections).map(([ticketId, quantity]) => ({
      ticketId,
      quantity,
    }))

    const participantsPayload = participants.map((participant) => ({ ...participant }))

    const upsellsPayload = Object.entries(selectedUpsells).map(([upsellId, config]) => ({
      upsellId,
      quantity: config.quantity,
      meta: config.meta || {},
    }))

    const summaryPayload: RegistrationSummary = {
      ticketTotal: summaryPricing.ticketTotal,
      upsellTotal: summaryPricing.upsellTotal,
      discountAmount: summaryPricing.discountAmount,
      totalDue: summaryPricing.totalDue,
      currency: summaryPricing.currency,
    }

    const signaturePayload = {
      imageDataUrl: signatureImage,
      regulationVersion: REGULATION_VERSION,
      signedAt:
        signatureImage && registrationDraft?.signature.imageDataUrl === signatureImage
          ? registrationDraft?.signature.signedAt ?? new Date().toISOString()
          : signatureImage
            ? new Date().toISOString()
            : null,
    }

    const disclaimerPayload = {
      read: disclaimerRead,
      accepted: disclaimerAccepted,
    }

    const draftPayload: RegistrationDraft = {
      eventId: event.id,
      userId: user.id,
      userEmail: user.email || '',
      paymentIntentId: paymentIntentId ?? null,
      clientSecret: clientSecret ?? null,
      ticketSelections: ticketSelectionArray,
      participants: participantsPayload,
      upsells: upsellsPayload,
      promoCode: appliedPromo?.code || null,
      summary: summaryPayload,
      signature: signaturePayload,
      disclaimer: disclaimerPayload,
    }

    const serialized = JSON.stringify(draftPayload)
    if (lastSavedDraftRef.current === serialized) {
      return
    }

    lastSavedDraftRef.current = serialized
    setRegistrationDraft(draftPayload)
  }, [
    registrationHasHydrated,
    registrationDraft,
    user,
    event.id,
    ticketSelections,
    participants,
    selectedUpsells,
    appliedPromo?.code,
    summaryPricing.ticketTotal,
    summaryPricing.upsellTotal,
    summaryPricing.discountAmount,
    summaryPricing.totalDue,
    summaryPricing.currency,
    clientSecret,
    paymentIntentId,
    signatureImage,
    disclaimerRead,
    disclaimerAccepted,
    setRegistrationDraft,
    clearRegistrationDraft,
  ])

  const stepProgress = ((stepIndex + 1) / steps.length) * 100
  const currentStepId = steps[stepIndex]?.id || 'tickets'

  const handleTicketQuantityChange = (ticketId: string, nextQuantity: number) => {
    setTicketSelections((previous) => {
      const clampedQuantity = Math.max(0, nextQuantity)
      const draft = { ...previous }
      if (clampedQuantity === 0) {
        delete draft[ticketId]
      } else {
        draft[ticketId] = clampedQuantity
      }
      return draft
    })
  }

  const handleParticipantChange = (
    participantId: string,
    field: keyof Participant,
    value: string,
  ) => {
    setParticipants((previous) =>
      previous.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              [field]: value,
            }
          : participant,
      ),
    )
  }

  const handleUpsellChange = (upsellId: string, quantity: number) => {
    setSelectedUpsells((previous) => {
      const upsell = upsells.find((item) => item.id === upsellId)
      const maxAllowed =
        upsell?.type === 'tshirt' ? selectedTicketSlots.length : Number.MAX_SAFE_INTEGER
      const nextQuantity = Math.min(Math.max(0, quantity), maxAllowed)
      const existing = previous[upsellId]

      let nextMeta = existing?.meta ? { ...existing.meta } : {}

      if (upsell?.type === 'tshirt') {
        const availableSizes = resolveUpsellSizes(upsell)
        nextMeta = buildTshirtMeta(existing?.meta, nextQuantity, availableSizes)
      }

      if (nextQuantity === 0 && Object.keys(nextMeta).length === 0) {
        if (!existing) {
          return previous
        }
        const { [upsellId]: _removed, ...rest } = previous
        return rest
      }

      const nextEntry = {
        quantity: nextQuantity,
        ...(Object.keys(nextMeta).length > 0 ? { meta: nextMeta } : {}),
      }

      return {
        ...previous,
        [upsellId]: nextEntry,
      }
    })
  }

  const handleUpsellSizeChange = (upsellId: string, index: number, size: string) => {
    setSelectedUpsells((previous) => {
      const upsell = upsells.find((item) => item.id === upsellId)
      if (!upsell) {
        return previous
      }

      const existing = previous[upsellId]
      if (!existing || existing.quantity <= index) {
        return previous
      }

      const availableSizes = resolveUpsellSizes(upsell)
      if (!availableSizes.includes(size)) {
        return previous
      }

      const normalizedSizes = normalizeTshirtSizes(existing.meta, existing.quantity, availableSizes)
      if (normalizedSizes[index] === size) {
        return previous
      }
      normalizedSizes[index] = size

      const baseMeta = { ...(existing.meta || {}) }
      delete baseMeta.size

      const nextMeta = {
        ...baseMeta,
        sizes: normalizedSizes,
      }

      return {
        ...previous,
        [upsellId]: {
          ...existing,
          meta: nextMeta,
        },
      }
    })
  }

  const resetPaymentIntent = () => {
    setClientSecret(null)
    setPaymentIntentId(null)
    setPricing(null)
  }

  useEffect(() => {
    resetPaymentIntent()
  }, [appliedPromo, selectedUpsells])

  const validatePromoCode = useCallback(async () => {
    const normalized = promoInput.trim().toUpperCase()
    if (!normalized) {
      setPromoError('Merci de saisir un code promo.')
      return
    }

    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: normalized,
          eventId: event.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Code promo invalide")
      }

      const data = (await response.json()) as { promotionalCode: AppliedPromo }
      setAppliedPromo(data.promotionalCode)
      setPromoError(null)
    } catch (error) {
      setAppliedPromo(null)
      setPromoError(error instanceof Error ? error.message : "Impossible d'appliquer ce code")
    }
  }, [event.id, promoInput])

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoInput('')
    setPromoError(null)
  }

  const ensurePaymentIntent = useCallback(async () => {
    if (!user) {
      setSubmissionMessage({
        type: 'error',
        text: 'Connectez-vous pour continuer votre inscription.',
      })
      return null
    }

    if (totalDue <= 0) {
      setSubmissionMessage({
        type: 'error',
        text: 'Le montant total doit être supérieur à zéro.',
      })
      return null
    }

    setIsCreatingPaymentIntent(true)
    setSubmissionMessage(null)

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          userId: user.id,
          userEmail: user.email,
          ticketSelections: Object.entries(ticketSelections).map(([ticketId, quantity]) => ({
            ticketId,
            quantity,
          })),
          participants: participants.map((participant) => ({
            ticketId: participant.ticketId,
            email: participant.email,
            firstName: participant.firstName,
            lastName: participant.lastName,
          })),
          upsells: Object.entries(selectedUpsells).map(([upsellId, config]) => ({
            upsellId,
            quantity: config.quantity,
            meta: config.meta || {},
          })),
          promoCode: appliedPromo?.code || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Impossible de préparer le paiement')
      }

      const data = await response.json() as {
        clientSecret: string
        paymentIntentId: string
        pricing: PricingSummary
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
      setPricing(data.pricing)
      return data
    } catch (error) {
      setSubmissionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la création du paiement',
      })
      throw error
    } finally {
      setIsCreatingPaymentIntent(false)
    }
  }, [appliedPromo?.code, event.id, participants, selectedUpsells, ticketSelections, totalDue, user])

  const proceedToNextStep = async () => {
    if (stepIndex === steps.length - 1) return

    if (steps[stepIndex + 1]?.id === 'confirmation') {
      try {
        await ensurePaymentIntent()
      } catch {
        return
      }
    }

    setStepIndex((index) => index + 1)
    setSubmissionMessage(null)
  }

  const goToPreviousStep = () => {
    setStepIndex((index) => Math.max(0, index - 1))
    setSubmissionMessage(null)
  }

  const handleProceedToPayment = async () => {
    if (!user) {
      setSubmissionMessage({
        type: 'error',
        text: 'Connectez-vous pour continuer votre inscription.',
      })
      return
    }

    if (!disclaimerRead || !disclaimerAccepted) {
      setSubmissionMessage({
        type: 'error',
        text: 'Merci de lire et accepter la décharge de responsabilité.',
      })
      return
    }

    if (!signatureImage) {
      setSubmissionMessage({
        type: 'error',
        text: 'Merci de dessiner votre signature pour valider.',
      })
      return
    }

    let localClientSecret = clientSecret
    let localPaymentIntentId = paymentIntentId
    let localPricing = pricing

    try {
      if (!localClientSecret || !localPaymentIntentId) {
        const paymentData = await ensurePaymentIntent()
        if (!paymentData) {
          return
        }
        localClientSecret = paymentData.clientSecret
        localPaymentIntentId = paymentData.paymentIntentId
        localPricing = paymentData.pricing
      }
    } catch {
      return
    }

    if (!localClientSecret || !localPaymentIntentId) {
      setSubmissionMessage({
        type: 'error',
        text: 'Impossible de préparer le paiement. Merci de réessayer.',
      })
      return
    }

    const payload = {
      eventId: event.id,
      userId: user.id,
      userEmail: user.email,
      paymentIntentId: localPaymentIntentId,
      clientSecret: localClientSecret,
      ticketSelections: Object.entries(ticketSelections).map(([ticketId, quantity]) => ({
        ticketId,
        quantity,
      })),
      participants: participants.map((participant) => ({
        id: participant.id,
        ticketId: participant.ticketId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        birthDate: participant.birthDate,
        emergencyContactName: participant.emergencyContactName,
        emergencyContactPhone: participant.emergencyContactPhone,
        medicalInfo: participant.medicalInfo,
        licenseNumber: participant.licenseNumber,
      })),
      upsells: Object.entries(selectedUpsells).map(([upsellId, config]) => ({
        upsellId,
        quantity: config.quantity,
        meta: config.meta || {},
      })),
      promoCode: appliedPromo?.code || null,
      summary: localPricing ?? summaryPricing,
      signature: {
        imageDataUrl: signatureImage,
        regulationVersion: REGULATION_VERSION,
        signedAt: new Date().toISOString(),
      },
      disclaimer: {
        read: disclaimerRead,
        accepted: disclaimerAccepted,
      },
    }

    setRegistrationDraft(payload)
    router.push(`/events/${event.id}/register/payment`)
  }

  const isTicketsStepValid = totalParticipants > 0

  const isParticipantsStepValid =
    participants.length === totalParticipants &&
    participants.every((participant) =>
      participant.firstName.trim() &&
      participant.lastName.trim() &&
      participant.email.trim(),
    )

  const isConfirmationStepValid = disclaimerRead && disclaimerAccepted && Boolean(signatureImage)

  const canContinue = (() => {
    switch (currentStepId) {
      case 'tickets':
        return isTicketsStepValid
      case 'participants':
        return isParticipantsStepValid
      case 'options':
        return true
      case 'confirmation':
        return isConfirmationStepValid
      default:
        return false
    }
  })()

  const renderTicketStep = () => (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const quantity = ticketSelections[ticket.id] ?? 0
        const isSelected = quantity > 0
        const currency = (ticket.currency || defaultCurrency).toLowerCase()
        return (
          <Card
            key={ticket.id}
            className={`transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
          >
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <TicketIcon className="h-4 w-4 text-primary" />
                  {ticket.name}
                </CardTitle>
                {ticket.description && (
                  <CardDescription>{ticket.description}</CardDescription>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {ticket.race?.distance_km ? (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {ticket.race.distance_km} km
                    </Badge>
                  ) : null}
                  {ticket.requires_document ? (
                    <Badge variant="secondary" className="gap-1">
                      <FileText className="h-3 w-3" />
                      Document requis
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="text-lg font-semibold text-primary">
                  {ticket.base_price_cents !== null && ticket.base_price_cents !== undefined
                    ? formatPrice(ticket.base_price_cents, currency)
                    : 'Tarif à venir'}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={quantity === 0}
                    onClick={() => handleTicketQuantityChange(ticket.id, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="w-10 text-center text-sm font-semibold">{quantity}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTicketQuantityChange(ticket.id, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        )
      })}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {availableSpots > 0
            ? `${availableSpots} places restantes sur l'événement. Dépêchez-vous !`
            : "L'événement affiche complet. Vous pouvez rejoindre la liste d'attente."}
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderParticipantsStep = () => (
    <div className="space-y-4">
      {participants.length === 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ajoutez au moins un billet pour renseigner les participants.
          </AlertDescription>
        </Alert>
      ) : null}

      {participants.map((participant, index) => {
        const ticket = ticketMap[participant.ticketId]
        return (
          <Card key={participant.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Participant {index + 1}</span>
                {ticket ? (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <TicketIcon className="h-3 w-3" />
                    {ticket.name}
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${participant.id}-firstName`}>Prénom</Label>
                <Input
                  id={`${participant.id}-firstName`}
                  value={participant.firstName}
                  onChange={(event) => handleParticipantChange(participant.id, 'firstName', event.target.value)}
                  placeholder="Camille"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${participant.id}-lastName`}>Nom</Label>
                <Input
                  id={`${participant.id}-lastName`}
                  value={participant.lastName}
                  onChange={(event) => handleParticipantChange(participant.id, 'lastName', event.target.value)}
                  placeholder="Martin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${participant.id}-email`}>Email</Label>
                <Input
                  id={`${participant.id}-email`}
                  type="email"
                  value={participant.email}
                  onChange={(event) => handleParticipantChange(participant.id, 'email', event.target.value)}
                  placeholder="camille.martin@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${participant.id}-birthDate`}>Date de naissance</Label>
                <Input
                  id={`${participant.id}-birthDate`}
                  type="date"
                  value={participant.birthDate}
                  onChange={(event) => handleParticipantChange(participant.id, 'birthDate', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${participant.id}-emergency`}>Contact d'urgence</Label>
                <Input
                  id={`${participant.id}-emergency`}
                  value={participant.emergencyContactName}
                  onChange={(event) => handleParticipantChange(participant.id, 'emergencyContactName', event.target.value)}
                  placeholder="Nom et prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${participant.id}-emergencyPhone`}>Téléphone d'urgence</Label>
                <Input
                  id={`${participant.id}-emergencyPhone`}
                  value={participant.emergencyContactPhone}
                  onChange={(event) => handleParticipantChange(participant.id, 'emergencyContactPhone', event.target.value)}
                  placeholder="06 xx xx xx xx"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`${participant.id}-medical`}>Informations médicales (optionnel)</Label>
                <Textarea
                  id={`${participant.id}-medical`}
                  rows={3}
                  value={participant.medicalInfo}
                  onChange={(event) => handleParticipantChange(participant.id, 'medicalInfo', event.target.value)}
                  placeholder="Allergies, traitement en cours, etc."
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderOptionsStep = () => (
    <div className="space-y-4">
      {upsells.length === 0 ? (
        <Alert>
          <Gift className="h-4 w-4" />
          <AlertDescription>Pas d'options additionnelles disponibles pour cet événement.</AlertDescription>
        </Alert>
      ) : null}

      {upsells.map((upsell) => {
        const selection = selectedUpsells[upsell.id]
        const quantity = selection?.quantity ?? 0
        const isSelected = quantity > 0
        const availableSizes = upsell.type === 'tshirt' ? resolveUpsellSizes(upsell) : []
        const selectedSizes =
          upsell.type === 'tshirt' ? normalizeTshirtSizes(selection?.meta, quantity, availableSizes) : []
        const maxQuantityForUpsell = upsell.type === 'tshirt' ? selectedTicketSlots.length : undefined
        const addDisabled =
          upsell.type === 'tshirt'
            ? !maxQuantityForUpsell || quantity >= maxQuantityForUpsell
            : false
        return (
          <Card key={upsell.id} className={`transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  {upsell.name}
                </CardTitle>
                {upsell.description && (
                  <CardDescription>{upsell.description}</CardDescription>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="text-lg font-semibold text-primary">
                  {formatPrice(upsell.price_cents, (upsell.currency || defaultCurrency).toLowerCase())}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={quantity === 0}
                    onClick={() => handleUpsellChange(upsell.id, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="w-10 text-center text-sm font-semibold">{quantity}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={addDisabled}
                    onClick={() => handleUpsellChange(upsell.id, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {upsell.type === 'tshirt' && quantity > 0 ? (
                  <div className="flex w-full flex-col items-end gap-2">
                    {selectedSizes.map((size, index) => (
                      <div key={`${upsell.id}-size-${index}`} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">T-shirt #{index + 1}</span>
                        <Select
                          value={size}
                          onValueChange={(value) => handleUpsellSizeChange(upsell.id, index, value)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Choisir une taille" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSizes.map((availableSize) => (
                              <SelectItem key={availableSize} value={availableSize}>
                                {availableSize}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : null}
                {upsell.type === 'tshirt' ? (
                  <p className="text-xs text-muted-foreground text-right">
                    {selectedTicketSlots.length > 0
                      ? `Maximum ${selectedTicketSlots.length} t-shirt${selectedTicketSlots.length > 1 ? 's' : ''} (${quantity}/${selectedTicketSlots.length} sélectionné${quantity > 1 ? 's' : ''}).`
                      : 'Sélectionnez au moins un billet pour ajouter un t-shirt.'}
                  </p>
                ) : null}
              </div>
            </CardHeader>
          </Card>
        )
      })}

    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Décharge de responsabilité
          </CardTitle>
          <CardDescription>
            Merci de lire attentivement ce texte avant de signer électroniquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-dashed border-muted/60 p-4 text-sm leading-relaxed">
            <p>
              Je reconnais participer à la course Overbound en pleine connaissance des risques inhérents aux activités sportives de pleine nature.
              J'atteste être en condition physique adéquate et disposer des certificats nécessaires le cas échéant.
            </p>
            <p>
              Je dégage Overbound, ses organisateurs, partenaires et bénévoles de toute responsabilité en cas d'accident ou de dommage matériel me concernant.
              Je m'engage à respecter le règlement de l'événement ainsi que les consignes de sécurité communiquées avant et pendant la course.
            </p>
            <p>
              Je comprends que ma sécurité dépend de ma vigilance et m'engage à signaler tout problème de santé susceptible d'altérer ma participation.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="disclaimer-read"
                checked={disclaimerRead}
                onCheckedChange={(checked) => setDisclaimerRead(checked === true)}
              />
              <Label htmlFor="disclaimer-read" className="text-sm leading-relaxed">
                J'ai lu et compris l'intégralité de la décharge de responsabilité.
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="disclaimer-accepted"
                checked={disclaimerAccepted}
                onCheckedChange={(checked) => setDisclaimerAccepted(checked === true)}
              />
              <Label htmlFor="disclaimer-accepted" className="text-sm leading-relaxed">
                J'accepte sans réserve les conditions ci-dessus et je renonce à tout recours contre Overbound.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signature manuscrite</CardTitle>
          <CardDescription>
            Dessinez votre signature comme sur un document officiel. Elle sera jointe à votre dossier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SignaturePad onChange={setSignatureImage} />
          <p className="text-xs text-muted-foreground">
            Une fois cette étape validée, vous serez redirigé vers la page de paiement sécurisé Stripe.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const stepContent: Record<StepKey, React.ReactNode> = {
    tickets: renderTicketStep(),
    participants: renderParticipantsStep(),
    options: renderOptionsStep(),
    confirmation: renderConfirmationStep(),
  }

  const selectedUpsellList = useMemo(() => {
    return Object.entries(selectedUpsells)
      .filter(([, config]) => config.quantity > 0)
      .map(([id, config]) => {
        const upsell = upsells.find((item) => item.id === id)
        if (!upsell) return null
        return {
          upsell,
          quantity: config.quantity,
          meta: config.meta || {},
        }
      })
      .filter(Boolean) as Array<{
      upsell: EventUpsell
      quantity: number
      meta: Record<string, any>
    }>
  }, [selectedUpsells, upsells])

  type UpsellSummaryItem = {
    id: string
    label: string
    quantity: number
    amount: number
    currency: string
    details: string[]
  }

  const humanizeMetaKey = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())

  const upsellSummaryItems = useMemo(() => {
    const items: UpsellSummaryItem[] = []

    selectedUpsellList.forEach(({ upsell, quantity, meta }) => {
      const currency = (upsell.currency || defaultCurrency).toLowerCase()

      if (upsell.type === 'tshirt') {
        const availableSizes = resolveUpsellSizes(upsell)
        const sizes = normalizeTshirtSizes(meta, quantity, availableSizes)
        sizes.forEach((size, index) => {
          items.push({
            id: `${upsell.id}-${index}`,
            label: upsell.name,
            quantity: 1,
            amount: upsell.price_cents,
            currency,
            details: [`Taille ${size}`],
          })
        })
        return
      }

      const details: string[] = []
      if (meta && typeof meta === 'object') {
        Object.entries(meta).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            return
          }
          if (key === 'sizes' && Array.isArray(value)) {
            const formattedSizes = value.filter((size): size is string => typeof size === 'string' && size.length > 0)
            if (formattedSizes.length > 0) {
              details.push(`Tailles : ${formattedSizes.join(', ')}`)
            }
            return
          }
          if (key === 'size' && typeof value === 'string' && value.length > 0) {
            details.push(`Taille ${value}`)
            return
          }

          if (Array.isArray(value)) {
            const serialized = value.map((entry) => String(entry)).join(', ')
            if (serialized.length > 0) {
              details.push(`${humanizeMetaKey(key)} : ${serialized}`)
            }
            return
          }

          if (typeof value === 'object') {
            return
          }

          details.push(`${humanizeMetaKey(key)} : ${String(value)}`)
        })
      }

      items.push({
        id: upsell.id,
        label: upsell.name,
        quantity,
        amount: upsell.price_cents * quantity,
        currency,
        details,
      })
    })

    return items
  }, [defaultCurrency, selectedUpsellList])

  return (
    <section className="mx-auto w-full space-y-6 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Inscription à {event.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(event.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {availableSpots > 0 ? `${availableSpots} places restantes` : 'Complet'}
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/events/${event.id}`}>Retour à l'événement</Link>
        </Button>
      </div>

      {user ? null : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous devez être connecté pour poursuivre votre inscription.{' '}
            <a href={`/auth/login?next=/events/${event.id}`} className="underline">
              Se connecter
            </a>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Étape {stepIndex + 1} sur {steps.length}</span>
              <span>{Math.round(stepProgress)}%</span>
            </div>
            <Progress value={stepProgress} className="h-2" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.6fr)_minmax(320px,1fr)]">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{steps[stepIndex]?.title}</h3>
                <p className="text-sm text-muted-foreground">{steps[stepIndex]?.description}</p>
              </div>

              <div>{stepContent[currentStepId]}</div>

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                {stepIndex === 0 ? (
                  <Button asChild variant="outline">
                    <Link href={`/events/${event.id}`}>
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Retour à l'événement
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" onClick={goToPreviousStep}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Précédent
                  </Button>
                )}

                {stepIndex < steps.length - 1 ? (
                  <Button onClick={proceedToNextStep} disabled={!canContinue || !user}>
                    Suivant
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={!canContinue || !user || isCreatingPaymentIntent}
                  >
                    {isCreatingPaymentIntent ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Préparation du paiement...
                      </>
                    ) : (
                      'Procéder au paiement sécurisé'
                    )}
                  </Button>
                )}
              </div>

              {submissionMessage ? (
                <Alert variant={submissionMessage.type === 'success' ? 'default' : 'destructive'}>
                  {submissionMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>{submissionMessage.text}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Résumé de la commande</CardTitle>
                  <CardDescription>Mettez à jour vos choix pour ajuster le total.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-3">
                    <div className="text-xs uppercase text-muted-foreground">Code promotionnel</div>
                    {appliedPromo ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4">
                        <div>
                          <p className="text-sm font-semibold text-primary">Code {appliedPromo.code}</p>
                          {appliedPromo.description ? (
                            <p className="text-xs text-muted-foreground">{appliedPromo.description}</p>
                          ) : null}
                        </div>
                        <Button variant="ghost" size="sm" onClick={removePromo}>
                          Retirer
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <Input
                          value={promoInput}
                          onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                          placeholder="EX: OVERBOUND10"
                          className="md:max-w-xs"
                        />
                        <Button type="button" onClick={validatePromoCode}>Appliquer</Button>
                      </div>
                    )}
                    {promoError ? <p className="text-xs text-destructive">{promoError}</p> : null}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-xs uppercase text-muted-foreground">Billets</div>
                    {selectedTicketSlots.length === 0 ? (
                      <p className="text-muted-foreground">Aucun billet sélectionné.</p>
                    ) : (
                      selectedTicketSlots.map((ticketId, index) => {
                        const ticket = ticketMap[ticketId]
                        const participant = participants[index]
                        if (!ticket) return null
                        return (
                          <div key={`${ticketId}-${index}`} className="flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="font-medium">{ticket.name}</p>
                              {participant?.firstName || participant?.lastName ? (
                                <p className="text-xs text-muted-foreground">{joinName(participant.firstName, participant.lastName)}</p>
                              ) : null}
                            </div>
                            <span className="font-medium">
                              {ticket.base_price_cents ? formatPrice(ticket.base_price_cents, (ticket.currency || defaultCurrency).toLowerCase()) : '—'}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-xs uppercase text-muted-foreground">Options</div>
                    {upsellSummaryItems.length === 0 ? (
                      <p className="text-muted-foreground">Aucune option ajoutée.</p>
                    ) : (
                      upsellSummaryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="font-medium">{item.quantity} × {item.label}</p>
                            {item.details.map((detail, index) => (
                              <p key={`${item.id}-detail-${index}`} className="text-xs text-muted-foreground">
                                {detail}
                              </p>
                            ))}
                          </div>
                          <span className="font-medium">
                            {formatPrice(item.amount, item.currency)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Sous-total billets</span>
                      <span>{formatPrice(summaryPricing.ticketTotal, summaryPricing.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Options</span>
                      <span>{formatPrice(summaryPricing.upsellTotal, summaryPricing.currency)}</span>
                    </div>
                    {summaryPricing.discountAmount > 0 ? (
                      <div className="flex items-center justify-between text-sm text-emerald-600">
                        <span>Réduction</span>
                        <span>- {formatPrice(summaryPricing.discountAmount, summaryPricing.currency)}</span>
                      </div>
                    ) : null}
                    <Separator />
                    <div className="flex items-center justify-between text-base font-semibold">
                      <span>Total à régler</span>
                      <span>{formatPrice(summaryPricing.totalDue, summaryPricing.currency)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Participants</CardTitle>
                  <CardDescription>Les informations seront visibles par l'équipe Overbound.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {participants.length === 0 ? (
                    <p className="text-muted-foreground">Aucun participant renseigné.</p>
                  ) : (
                    participants.map((participant) => {
                      const ticket = ticketMap[participant.ticketId]
                      return (
                        <div key={participant.id} className="rounded-lg border border-muted/60 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{joinName(participant.firstName, participant.lastName) || 'Participant'}</span>
                            {ticket ? <Badge variant="outline">{ticket.name}</Badge> : null}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {participant.email || 'Email à renseigner'}
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
