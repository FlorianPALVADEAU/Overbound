'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMyGroup } from '@/app/api/groups/groupQueries'
import { useRouter } from 'next/navigation'
import { REGULATION_VERSION, DISTANCE_MIN_KM, DISTANCE_MAX_KM, REGISTRATION_STEPS } from '@/constants/registration'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { isOpenFormatTicket } from '@/lib/openSas'

import { useTicketSelections } from '@/hooks/registration/useTicketSelections'
import { useParticipants } from '@/hooks/registration/useParticipants'
import { useUpsells } from '@/hooks/registration/useUpsells'
import { usePromoCode } from '@/hooks/registration/usePromoCode'
import { useRegistrationPricing } from '@/hooks/registration/useRegistrationPricing'
import { usePaymentIntent } from '@/hooks/registration/usePaymentIntent'
import { useRegistrationDraftSync } from '@/hooks/registration/useRegistrationDraftSync'

import type { MultiStepEventRegistrationProps } from './types'
import RegistrationHeader from './RegistrationHeader'
import RegistrationSection from './RegistrationSection'
import TicketSelectionStep from './TicketSelectionStep'
import ParticipantsStep from './ParticipantsStep'
import OptionsStep from './OptionsStep'
import ConfirmationStep from './ConfirmationStep'
import OrderSummarySidebar from './OrderSummarySidebar'
import RegistrationPaymentBar from './RegistrationPaymentBar'
import ParticipantSummarySidebar from './ParticipantSummarySidebar'
import GroupJoinInline from './GroupJoinInline'
import InlineAuthStep from './InlineAuthStep'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Users } from 'lucide-react'
import { formatWaveStartTime } from '@/lib/openSas'

export default function MultiStepEventRegistration({
  event,
  tickets,
  eventPriceTiers = [],
  upsells,
  user,
  availableSpots,
  initialTicketId = null,
}: MultiStepEventRegistrationProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setRegistrationDraft = useRegistrationStore((state) => state.setDraft)
  const clearRegistrationDraft = useRegistrationStore((state) => state.clear)
  const addToCartTrackedRef = useRef(false)
  const suppressEmptyParticipantsSyncRef = useRef(false)
  const participantsSectionRef = useRef<HTMLDivElement>(null)
  const hasAutoScrolledToParticipantsRef = useRef(false)
  const { data: myGroup } = useMyGroup({ enabled: Boolean(user) })

  // Local UI state
  const [disclaimerRead, setDisclaimerRead] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [rulebookAccepted, setRulebookAccepted] = useState(false)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [showInlineAuth, setShowInlineAuth] = useState(false)
  const pendingPaymentAfterAuthRef = useRef(false)

  // Default currency (needed before pricing hook)
  const defaultCurrency = useMemo(() => {
    const first = tickets.find((t) => t.currency)?.currency
    return (first || 'eur').toLowerCase()
  }, [tickets])

  // Domain hooks
  const {
    ticketSelections,
    setTicketSelections,
    ticketMap,
    selectedTicketSlots,
    totalParticipants,
    handleTicketQuantityChange,
  } = useTicketSelections(tickets)

  const { participants, setParticipants, handleParticipantChange } = useParticipants(
    selectedTicketSlots,
    user,
    suppressEmptyParticipantsSyncRef,
  )

  const {
    selectedUpsells,
    setSelectedUpsells,
    handleUpsellChange,
    handleUpsellAssignmentToggle,
    handleUpsellSizeChange,
    upsellSummaryItems,
  } = useUpsells(upsells, selectedTicketSlots, participants, defaultCurrency)

  const {
    appliedPromos,
    setAppliedPromos,
    ambassadorReferralCode,
    promoInput,
    setPromoInput,
    promoError,
    setPromoError,
    validatePromoCode,
    removePromo,
  } = usePromoCode(event.id)

  const {
    activeTier,
    hasActiveDiscount,
    isTierDiscountOverriddenByPromo,
    totalDue,
    computedPricing,
  } = useRegistrationPricing(
    tickets,
    selectedTicketSlots,
    ticketMap,
    selectedUpsells,
    upsells,
    appliedPromos,
    eventPriceTiers,
    null,
  )

  const {
    clientSecret,
    setClientSecret,
    paymentIntentId,
    setPaymentIntentId,
    pricing: serverPricing,
    setPricing,
    isCreatingPaymentIntent,
    submissionMessage,
    setSubmissionMessage,
    ensurePaymentIntent,
  } = usePaymentIntent(
    event,
    user,
    ticketSelections,
    participants,
    selectedUpsells,
    appliedPromos,
    ambassadorReferralCode,
    totalDue,
  )

  const summaryPricing = serverPricing ?? computedPricing

  const trackRegistrationEvent = (
    eventName: string,
    payload: Record<string, unknown> = {},
  ) => {
    if (typeof window === 'undefined') return
    const analyticsWindow = window as Window & {
      dataLayer?: Array<Record<string, unknown>>
      gtag?: (...args: unknown[]) => void
      fbq?: (...args: unknown[]) => void
    }
    const eventPayload = {
      event: eventName,
      event_slug: event.slug,
      event_id: event.id,
      ...payload,
    }
    analyticsWindow.dataLayer?.push(eventPayload)
    analyticsWindow.gtag?.('event', eventName, {
      event_category: 'event_register',
      event_label: event.slug,
      ...payload,
    })
  }

  // Step validation
  const isTicketsStepValid = totalParticipants > 0

  const isParticipantsStepValid =
    participants.length === totalParticipants &&
    participants.every((participant) => {
      const ticket = ticketMap[participant.ticketId]
      const isUniversalRace = ticket?.race?.is_universal ?? true
      const hasDifficultyIfNeeded = isUniversalRace || participant.difficultyLevel
      const isOpenFormat = isOpenFormatTicket(ticket?.name, ticket?.race?.name)
      const distanceMin = Number(participant.distanceMinKm)
      const distanceIdeal = Number(participant.distanceIdealKm)
      const hasDistances =
        participant.distanceMinKm.trim() &&
        participant.distanceIdealKm.trim() &&
        Number.isFinite(distanceMin) &&
        Number.isFinite(distanceIdeal) &&
        distanceMin >= DISTANCE_MIN_KM &&
        distanceMin <= DISTANCE_MAX_KM &&
        distanceIdeal >= DISTANCE_MIN_KM &&
        distanceIdeal <= DISTANCE_MAX_KM &&
        distanceIdeal >= distanceMin

      return (
        participant.firstName.trim() &&
        participant.lastName.trim() &&
        participant.email.trim() &&
        participant.birthDate.trim() &&
        participant.emergencyContactName.trim() &&
        participant.emergencyContactPhone.trim() &&
        hasDifficultyIfNeeded &&
        (isOpenFormat ? hasDistances : true)
      )
    })

  const isConfirmationStepValid =
    disclaimerRead && disclaimerAccepted && rulebookAccepted && Boolean(signatureImage)

  // Draft sync still persists a step index for restore purposes even though
  // the UI no longer gates on it; keep it stable at 0.
  const stepIndex = 0
  const setStepIndex = () => {}

  // Draft sync
  useRegistrationDraftSync(
    {
      eventId: event.id,
      user,
      ticketSelections,
      participants,
      selectedUpsells,
      appliedPromos,
      ambassadorReferralCode,
      groupId: myGroup?.id ?? null,
      summaryPricing,
      clientSecret,
      paymentIntentId,
      signatureImage,
      disclaimerRead,
      disclaimerAccepted,
      rulebookAccepted,
      stepIndex,
    },
    {
      setTicketSelections,
      setParticipants,
      setSelectedUpsells,
      setAppliedPromos,
      setPromoInput,
      setPromoError,
      setDisclaimerRead,
      setDisclaimerAccepted,
      setRulebookAccepted,
      setSignatureImage,
      setClientSecret,
      setPaymentIntentId,
      setPricing,
      setStepIndex,
      setSubmissionMessage,
    },
    initialTicketId,
    tickets,
    suppressEmptyParticipantsSyncRef,
  )

  // Fire add-to-cart tracking once, as soon as at least one participant slot exists
  useEffect(() => {
    if (addToCartTrackedRef.current || totalParticipants === 0) return

    const selectedTicketIds = Object.entries(ticketSelections)
      .filter(([, quantity]) => (quantity || 0) > 0)
      .map(([ticketId]) => ticketId)

    trackRegistrationEvent('add_to_cart', {
      step: 'participants',
      ticket_count: selectedTicketIds.length,
      participant_count: totalParticipants,
      ticket_ids: selectedTicketIds.join(','),
    })

    const analyticsWindow = window as Window & {
      fbq?: (...args: unknown[]) => void
    }
    analyticsWindow.fbq?.('track', 'AddToCart', {
      content_name: event.title || event.slug,
      content_category: 'event_register',
      content_type: 'product',
      content_ids: selectedTicketIds,
      value: Number((summaryPricing.totalDue / 100).toFixed(2)),
      currency: summaryPricing.currency.toUpperCase(),
    })

    addToCartTrackedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalParticipants])

  // Guide the user to the participants section the first time a ticket is selected
  useEffect(() => {
    if (hasAutoScrolledToParticipantsRef.current || totalParticipants === 0) return
    hasAutoScrolledToParticipantsRef.current = true
    participantsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [totalParticipants])

  // Payment handler
  const handleProceedToPayment = async () => {
    if (!isTicketsStepValid || !isParticipantsStepValid) {
      setShowValidationErrors(true)
      setSubmissionMessage({
        type: 'error',
        text: 'Veuillez remplir tous les champs obligatoires.',
      })
      return
    }

    if (!user) {
      setShowInlineAuth(true)
      return
    }

    if (!disclaimerRead || !disclaimerAccepted || !rulebookAccepted || !signatureImage) {
      setShowValidationErrors(true)
      setSubmissionMessage({
        type: 'error',
        text: !disclaimerRead || !disclaimerAccepted || !rulebookAccepted
          ? 'Merci de lire et accepter la décharge ainsi que le règlement officiel.'
          : 'Merci de dessiner votre signature pour valider.',
      })
      return
    }

    let localClientSecret = clientSecret
    let localPaymentIntentId = paymentIntentId
    let localPricing = serverPricing

    try {
      if (!localClientSecret || !localPaymentIntentId) {
        const paymentData = await ensurePaymentIntent()
        if (!paymentData) return

        // Free order: 100% discount, bypass Stripe entirely
        if ('freeOrder' in paymentData && paymentData.freeOrder) {
          const freePayload = {
            paymentIntentId: paymentData.freeOrderId,
            eventId: event.id,
            userId: user.id,
            ticketSelections: Object.entries(ticketSelections).map(([ticketId, quantity]) => ({
              ticketId,
              quantity,
            })),
            participants: participants.map((p) => ({
              ticketId: p.ticketId,
              firstName: p.firstName,
              lastName: p.lastName,
              email: p.email,
              birthDate: p.birthDate,
              emergencyContactName: p.emergencyContactName,
              emergencyContactPhone: p.emergencyContactPhone,
              medicalInfo: p.medicalInfo,
              licenseNumber: p.licenseNumber,
              distanceIdealKm: p.distanceIdealKm,
              distanceMinKm: p.distanceMinKm,
              difficultyLevel: p.difficultyLevel || null,
            })),
            upsells: Object.entries(selectedUpsells).map(([upsellId, config]) => ({
              upsellId,
              quantity: config.quantity,
              meta: config.meta || {},
            })),
            promoCodes: appliedPromos.map((promo) => promo.code),
            ambassadorReferralCode: ambassadorReferralCode ?? null,
            signatureImage,
            signatureMetadata: {
              regulationVersion: REGULATION_VERSION,
              signedAt: new Date().toISOString(),
            },
            disclaimer: {
              read: disclaimerRead,
              accepted: disclaimerAccepted,
              rulebookAccepted,
            },
            freeOrderMetadata: 'freeOrderMetadata' in paymentData ? paymentData.freeOrderMetadata : {},
          }

          const freeResponse = await fetch('/api/registrations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(freePayload),
          })

          if (!freeResponse.ok) {
            const errorBody = await freeResponse.json().catch(() => ({}))
            setSubmissionMessage({
              type: 'error',
              text: errorBody.error || 'Erreur lors de la finalisation de l\'inscription.',
            })
            return
          }

          clearRegistrationDraft()
          router.replace('/account/tickets')
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
      participants: participants.map((p) => ({
        id: p.id,
        ticketId: p.ticketId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        birthDate: p.birthDate,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        medicalInfo: p.medicalInfo,
        licenseNumber: p.licenseNumber,
        distanceIdealKm: p.distanceIdealKm,
        distanceMinKm: p.distanceMinKm,
        difficultyLevel: p.difficultyLevel || null,
      })),
      upsells: Object.entries(selectedUpsells).map(([upsellId, config]) => ({
        upsellId,
        quantity: config.quantity,
        meta: config.meta || {},
      })),
      promoCodes: appliedPromos.map((promo) => promo.code),
      ambassadorReferralCode: ambassadorReferralCode ?? null,
      groupId: myGroup?.id ?? null,
      summary: localPricing ?? summaryPricing,
      signature: {
        imageDataUrl: signatureImage,
        regulationVersion: REGULATION_VERSION,
        signedAt: new Date().toISOString(),
      },
      disclaimer: {
        read: disclaimerRead,
        accepted: disclaimerAccepted,
        rulebookAccepted,
      },
    }

    setRegistrationDraft(payload)
    router.push(`/events/${event.slug}/register/payment`)
  }

  // Once the guest authenticates inline, retry the payment step automatically
  useEffect(() => {
    if (user && pendingPaymentAfterAuthRef.current) {
      pendingPaymentAfterAuthRef.current = false
      setShowInlineAuth(false)
      void handleProceedToPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleInlineAuthenticated = () => {
    pendingPaymentAfterAuthRef.current = true
    // The page mounts this query keyed by whatever route param it received
    // (event slug or id), which this component doesn't know — match broadly
    // on the 'register-data' marker instead of reconstructing the exact key.
    void queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'events' && query.queryKey[2] === 'register-data',
    })
  }

  const groupBanner = !user ? null : !myGroup ? (
    <GroupJoinInline />
  ) : myGroup.anchor_event_id === event.id && myGroup.anchor_start_time ? (
    <Alert className="border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300">
      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-xs leading-relaxed">
        <p>
          <span className="font-semibold">Groupe {myGroup.name} —</span>{' '}
          ta vague de départ est déjà fixée par ton groupe :{' '}
          <span className="font-semibold">{formatWaveStartTime(myGroup.anchor_start_time)}</span>.{' '}
          Tous les membres inscrits à cet événement partiront ensemble. Le départ groupé concerne le format{' '}
          <span className="font-semibold">OPEN</span>. En format{' '}
          <span className="font-semibold">RANKED</span>, le départ est unique pour tous.
        </p>
      </AlertDescription>
    </Alert>
  ) : (
    <Alert className="border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300">
      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-xs leading-relaxed">
        <p>
          <span className="font-semibold">Groupe {myGroup.name} —</span>{' '}
          tu es le premier membre à t&apos;inscrire à cet événement. Ta vague de départ sera automatiquement réservée pour tout le groupe. Le départ groupé concerne le format{' '}
          <span className="font-semibold">OPEN</span>. En format{' '}
          <span className="font-semibold">RANKED</span>, le départ est unique pour tous.
        </p>
      </AlertDescription>
    </Alert>
  )

  return (
    <section className="mx-auto w-full space-y-6 py-6 pb-24">
      <RegistrationHeader
        event={event}
        availableSpots={availableSpots}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.6fr)_minmax(320px,1fr)] lg:items-start">
        <div className="space-y-6">
          <RegistrationSection
            index={1}
            title={REGISTRATION_STEPS[0].title}
            description={REGISTRATION_STEPS[0].description}
            isComplete={isTicketsStepValid}
          >
            <TicketSelectionStep
              tickets={tickets}
              ticketSelections={ticketSelections}
              onTicketQuantityChange={handleTicketQuantityChange}
              defaultCurrency={defaultCurrency}
              activeTier={activeTier}
              hasActiveDiscount={hasActiveDiscount}
              availableSpots={availableSpots}
              groupBanner={groupBanner}
            />
          </RegistrationSection>

          <RegistrationSection
            index={2}
            title={REGISTRATION_STEPS[1].title}
            description={REGISTRATION_STEPS[1].description}
            isComplete={totalParticipants > 0 && isParticipantsStepValid}
            sectionRef={participantsSectionRef}
          >
            <ParticipantsStep
              participants={participants}
              ticketMap={ticketMap}
              onFieldChange={handleParticipantChange}
              showErrors={showValidationErrors}
              groupBanner={groupBanner}
            />
          </RegistrationSection>

          <RegistrationSection
            index={3}
            title={REGISTRATION_STEPS[2].title}
            description={REGISTRATION_STEPS[2].description}
            optional
          >
            <OptionsStep
              upsells={upsells}
              selectedUpsells={selectedUpsells}
              selectedTicketSlots={selectedTicketSlots}
              participants={participants}
              defaultCurrency={defaultCurrency}
              onQuantityChange={handleUpsellChange}
              onSizeChange={handleUpsellSizeChange}
              onAssignmentToggle={handleUpsellAssignmentToggle}
            />
          </RegistrationSection>

          <RegistrationSection
            index={4}
            title={REGISTRATION_STEPS[3].title}
            description={REGISTRATION_STEPS[3].description}
            isComplete={isConfirmationStepValid}
          >
            <ConfirmationStep
              disclaimerRead={disclaimerRead}
              disclaimerAccepted={disclaimerAccepted}
              rulebookAccepted={rulebookAccepted}
              signatureImage={signatureImage}
              showErrors={showValidationErrors}
              onDisclaimerReadChange={setDisclaimerRead}
              onDisclaimerAcceptedChange={setDisclaimerAccepted}
              onRulebookAcceptedChange={setRulebookAccepted}
              onSignatureChange={setSignatureImage}
            />
          </RegistrationSection>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <OrderSummarySidebar
            selectedTicketSlots={selectedTicketSlots}
            ticketMap={ticketMap}
            participants={participants}
            defaultCurrency={defaultCurrency}
            activeTier={activeTier}
            hasActiveDiscount={hasActiveDiscount}
            isTierDiscountOverriddenByPromo={isTierDiscountOverriddenByPromo}
            upsellSummaryItems={upsellSummaryItems}
            summaryPricing={summaryPricing}
            appliedPromos={appliedPromos}
            promoInput={promoInput}
            promoError={promoError}
            onPromoInputChange={setPromoInput}
            onValidatePromo={validatePromoCode}
            onRemovePromo={removePromo}
            submissionMessage={submissionMessage}
          />

          <ParticipantSummarySidebar
            participants={participants}
            ticketMap={ticketMap}
          />
        </aside>
      </div>

      <RegistrationPaymentBar
        summaryPricing={summaryPricing}
        ticketCount={totalParticipants}
        upsellCount={upsellSummaryItems.reduce((sum, item) => sum + item.quantity, 0)}
        isCreatingPaymentIntent={isCreatingPaymentIntent}
        isAuthPending={showInlineAuth}
        isFormComplete={isTicketsStepValid && isParticipantsStepValid && isConfirmationStepValid}
        submissionMessage={submissionMessage}
        onPayment={handleProceedToPayment}
      />

      <Dialog open={showInlineAuth} onOpenChange={setShowInlineAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Connexion requise</DialogTitle>
          <InlineAuthStep onAuthenticated={handleInlineAuthenticated} />
        </DialogContent>
      </Dialog>
    </section>
  )
}
