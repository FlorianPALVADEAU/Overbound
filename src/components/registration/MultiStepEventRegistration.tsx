'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { REGULATION_VERSION, DISTANCE_MIN_KM, DISTANCE_MAX_KM } from '@/constants/registration'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { isOpenFormatTicket } from '@/lib/openSas'

import { useTicketSelections } from '@/hooks/registration/useTicketSelections'
import { useParticipants } from '@/hooks/registration/useParticipants'
import { useUpsells } from '@/hooks/registration/useUpsells'
import { usePromoCode } from '@/hooks/registration/usePromoCode'
import { useRegistrationPricing } from '@/hooks/registration/useRegistrationPricing'
import { usePaymentIntent } from '@/hooks/registration/usePaymentIntent'
import { useStepNavigation } from '@/hooks/registration/useStepNavigation'
import { useRegistrationDraftSync } from '@/hooks/registration/useRegistrationDraftSync'

import type { MultiStepEventRegistrationProps, StepKey } from './types'
import RegistrationHeader from './RegistrationHeader'
import StepProgressBar from './StepProgressBar'
import StepNavigation from './StepNavigation'
import TicketSelectionStep from './TicketSelectionStep'
import ParticipantsStep from './ParticipantsStep'
import OptionsStep from './OptionsStep'
import ConfirmationStep from './ConfirmationStep'
import OrderSummarySidebar from './OrderSummarySidebar'
import ParticipantSummarySidebar from './ParticipantSummarySidebar'

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
  const setRegistrationDraft = useRegistrationStore((state) => state.setDraft)

  // Local UI state
  const [disclaimerRead, setDisclaimerRead] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [showValidationErrors, setShowValidationErrors] = useState(false)

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
    appliedPromo,
    setAppliedPromo,
    promoInput,
    setPromoInput,
    promoError,
    setPromoError,
    validatePromoCode,
    removePromo,
  } = usePromoCode(event.id)

  const { activeTier, hasActiveDiscount, totalDue, computedPricing } = useRegistrationPricing(
    tickets,
    selectedTicketSlots,
    ticketMap,
    selectedUpsells,
    upsells,
    appliedPromo,
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
    appliedPromo,
    totalDue,
  )

  const summaryPricing = serverPricing ?? computedPricing

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

  const isConfirmationStepValid = disclaimerRead && disclaimerAccepted && Boolean(signatureImage)

  const {
    stepIndex,
    setStepIndex,
    currentStepId,
    stepProgress,
    isTransitioning,
    canContinue,
    proceedToNextStep,
    goToPreviousStep,
  } = useStepNavigation(
    { isTicketsStepValid, isParticipantsStepValid, isConfirmationStepValid },
    ensurePaymentIntent,
  )

  // Draft sync
  useRegistrationDraftSync(
    {
      eventId: event.id,
      user,
      ticketSelections,
      participants,
      selectedUpsells,
      appliedPromo,
      summaryPricing,
      clientSecret,
      paymentIntentId,
      signatureImage,
      disclaimerRead,
      disclaimerAccepted,
    },
    {
      setTicketSelections,
      setParticipants,
      setSelectedUpsells,
      setAppliedPromo,
      setPromoInput,
      setPromoError,
      setDisclaimerRead,
      setDisclaimerAccepted,
      setSignatureImage,
      setClientSecret,
      setPaymentIntentId,
      setPricing,
      setStepIndex,
      setSubmissionMessage,
    },
    initialTicketId,
    tickets,
  )

  // Navigation wrappers
  const handleNext = async () => {
    if (!canContinue) {
      setShowValidationErrors(true)
      setSubmissionMessage({
        type: 'error',
        text: 'Veuillez remplir tous les champs obligatoires.',
      })
      return
    }
    setShowValidationErrors(false)
    setSubmissionMessage(null)
    await proceedToNextStep()
  }

  const handlePrevious = () => {
    goToPreviousStep()
    setSubmissionMessage(null)
    setShowValidationErrors(false)
  }

  // Payment handler
  const handleProceedToPayment = async () => {
    if (!user) {
      setSubmissionMessage({
        type: 'error',
        text: 'Connectez-vous pour continuer votre inscription.',
      })
      return
    }

    if (!disclaimerRead || !disclaimerAccepted || !signatureImage) {
      setShowValidationErrors(true)
      setSubmissionMessage({
        type: 'error',
        text: !disclaimerRead || !disclaimerAccepted
          ? 'Merci de lire et accepter la décharge de responsabilité.'
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
    router.push(`/events/${event.slug}/register/payment`)
  }

  // Step content mapping
  const stepContent: Record<StepKey, React.ReactNode> = {
    tickets: (
      <TicketSelectionStep
        tickets={tickets}
        ticketSelections={ticketSelections}
        onTicketQuantityChange={handleTicketQuantityChange}
        defaultCurrency={defaultCurrency}
        activeTier={activeTier}
        hasActiveDiscount={hasActiveDiscount}
        availableSpots={availableSpots}
      />
    ),
    participants: (
      <ParticipantsStep
        participants={participants}
        ticketMap={ticketMap}
        onFieldChange={handleParticipantChange}
        showErrors={showValidationErrors}
      />
    ),
    options: (
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
    ),
    confirmation: (
      <ConfirmationStep
        disclaimerRead={disclaimerRead}
        disclaimerAccepted={disclaimerAccepted}
        signatureImage={signatureImage}
        showErrors={showValidationErrors}
        onDisclaimerReadChange={setDisclaimerRead}
        onDisclaimerAcceptedChange={setDisclaimerAccepted}
        onSignatureChange={setSignatureImage}
      />
    ),
  }

  return (
    <section className="mx-auto w-full space-y-6 py-6">
      <RegistrationHeader
        event={event}
        availableSpots={availableSpots}
        isAuthenticated={Boolean(user)}
      />

      <Card className="relative">
        {isTransitioning && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium text-muted-foreground">
                Préparation de l&apos;étape suivante...
              </p>
            </div>
          </div>
        )}

        <CardContent className="space-y-6 pt-6">
          <StepProgressBar stepIndex={stepIndex} stepProgress={stepProgress} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.6fr)_minmax(320px,1fr)]">
            <div className="space-y-6">
              <div>{stepContent[currentStepId]}</div>

              <StepNavigation
                stepIndex={stepIndex}
                eventId={event.id}
                isAuthenticated={Boolean(user)}
                isCreatingPaymentIntent={isCreatingPaymentIntent}
                submissionMessage={submissionMessage}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onPayment={handleProceedToPayment}
              />
            </div>

            <aside className="space-y-4">
              <OrderSummarySidebar
                selectedTicketSlots={selectedTicketSlots}
                ticketMap={ticketMap}
                participants={participants}
                defaultCurrency={defaultCurrency}
                activeTier={activeTier}
                hasActiveDiscount={hasActiveDiscount}
                upsellSummaryItems={upsellSummaryItems}
                summaryPricing={summaryPricing}
                appliedPromo={appliedPromo}
                promoInput={promoInput}
                promoError={promoError}
                onPromoInputChange={setPromoInput}
                onValidatePromo={validatePromoCode}
                onRemovePromo={removePromo}
              />

              <ParticipantSummarySidebar
                participants={participants}
                ticketMap={ticketMap}
              />
            </aside>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
