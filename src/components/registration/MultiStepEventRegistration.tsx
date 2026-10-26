'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMyGroup } from '@/app/api/groups/groupQueries'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAddToCartTracking } from '@/hooks/registration/useAddToCartTracking'
import { useCheckoutConsents } from '@/hooks/registration/useCheckoutConsents'
import { useCheckoutDraft } from '@/hooks/registration/useCheckoutDraft'
import { useCheckoutOrderLines } from '@/hooks/registration/useCheckoutOrderLines'
import { useCheckoutSubmission } from '@/hooks/registration/useCheckoutSubmission'
import { useCheckoutValidation } from '@/hooks/registration/useCheckoutValidation'
import { useOrderPricing } from '@/hooks/registration/useOrderPricing'
import { useParticipants } from '@/hooks/registration/useParticipants'
import { usePaymentIntent } from '@/hooks/registration/usePaymentIntent'
import { usePromoCode } from '@/hooks/registration/usePromoCode'
import { useRegistrationDraftSync } from '@/hooks/registration/useRegistrationDraftSync'
import { useTicketSelections } from '@/hooks/registration/useTicketSelections'
import { useUpsells } from '@/hooks/registration/useUpsells'
import type { GroupIntent } from '@/lib/groups/invite'
import { pricingErrorMessage, promoRejectionMessage } from '@/lib/orderPricing'
import ConfirmationStep from './ConfirmationStep'
import GroupPanel from './GroupPanel'
import InlineAuthStep from './InlineAuthStep'
import OptionsStep from './OptionsStep'
import OrderSummarySidebar from './OrderSummarySidebar'
import ParticipantsStep from './ParticipantsStep'
import RegistrationHeader from './RegistrationHeader'
import RegistrationPaymentBar, { PayButton } from './RegistrationPaymentBar'
import RegistrationSection from './RegistrationSection'
import { OrderLines } from './summary'
import TicketSelectionStep from './TicketSelectionStep'
import type { MultiStepEventRegistrationProps } from './types'

/** The checkout page: it wires the steps together and holds no business rule of its own. */
export default function MultiStepEventRegistration({
  event,
  tickets,
  eventPriceTiers = [],
  tierRegistrationCounts = {},
  upsells,
  user,
  availableSpots,
  initialTicketId = null,
  initialWaveIndex = null,
  groupIntent = null,
  inviteCode = null,
}: MultiStepEventRegistrationProps) {
  const queryClient = useQueryClient()
  const { data: myGroup } = useMyGroup({ enabled: Boolean(user) })
  const suppressEmptyParticipantsSyncRef = useRef(false)
  const participantsSectionRef = useRef<HTMLElement>(null)
  const [authReason, setAuthReason] = useState<'payment' | 'group' | null>(null)
  const [pendingGroupIntent, setPendingGroupIntent] = useState<GroupIntent | null>(null)
  const currency = (tickets.find((ticket) => ticket.currency)?.currency ?? 'eur').toLowerCase()

  const { ticketSelections, setTicketSelections, ticketMap, selectedTicketSlots, totalParticipants, handleTicketQuantityChange } =
    useTicketSelections(tickets)
  const { participants, setParticipants, handleParticipantChange, handleWaveSelection } = useParticipants(
    selectedTicketSlots,
    user,
    suppressEmptyParticipantsSyncRef,
  )
  const upsellState = useUpsells(upsells, selectedTicketSlots, participants, currency)
  const promo = usePromoCode(event.id)
  const { consents, setConsent, setSignature } = useCheckoutConsents()

  const flexibleBySlot = useMemo(() => participants.map((participant) => participant.flexible === true), [participants])
  const checkout = useOrderPricing(
    {
      ticketSlots: selectedTicketSlots,
      flexibleBySlot,
      tickets,
      tiers: eventPriceTiers,
      tierRegistrationCounts,
      upsells,
      selectedUpsells: upsellState.selectedUpsells,
      appliedPromos: promo.appliedPromos,
    },
    currency,
  )
  const amountKey = JSON.stringify([ticketSelections, upsellState.selectedUpsells, promo.appliedPromos.map((p) => p.code), flexibleBySlot])
  const { payment, isCreating, preparePayment } = usePaymentIntent(event, amountKey)
  const summary = payment.pricing ?? checkout.summary

  const groupAnchor = useMemo(
    () =>
      myGroup && myGroup.anchor_event_id === event.id && myGroup.anchor_wave_index != null && myGroup.anchor_start_time
        ? { waveIndex: myGroup.anchor_wave_index, startTime: myGroup.anchor_start_time }
        : null,
    [myGroup, event.id],
  )
  const needsGroupAttestation = participants.length > 1

  const { validation, showErrors, revealErrors } = useCheckoutValidation({
    participants,
    ticketCount: totalParticipants,
    eventDate: event.date,
    ticketMap,
    hasGroupAnchor: Boolean(groupAnchor),
    consents,
    needsGroupAttestation,
  })

  const completeById = useMemo(
    () => Object.fromEntries(Object.entries(validation.participantErrors).map(([id, errors]) => [id, Object.keys(errors).length === 0])),
    [validation.participantErrors],
  )

  const draft = useCheckoutDraft({
    eventId: event.id,
    user,
    ticketSelections,
    participants,
    selectedUpsells: upsellState.selectedUpsells,
    appliedPromos: promo.appliedPromos,
    ambassadorReferralCode: promo.ambassadorReferralCode,
    groupId: myGroup?.id ?? null,
    summary,
    clientSecret: payment.clientSecret,
    paymentIntentId: payment.paymentIntentId,
    consents,
    needsGroupAttestation,
  })
  useRegistrationDraftSync(
    draft,
    {
      setTicketSelections,
      setParticipants,
      setSelectedUpsells: upsellState.setSelectedUpsells,
      setAppliedPromos: promo.setAppliedPromos,
    },
    initialTicketId,
    tickets.map((ticket) => ticket.id),
    suppressEmptyParticipantsSyncRef,
  )

  const submission = useCheckoutSubmission({
    eventSlug: event.slug,
    draft,
    validation,
    isSignedIn: Boolean(user),
    revealErrors,
    requestSignIn: () => setAuthReason('payment'),
    preparedPayment:
      payment.clientSecret && payment.paymentIntentId && payment.pricing
        ? { kind: 'stripe', clientSecret: payment.clientSecret, paymentIntentId: payment.paymentIntentId, pricing: payment.pricing }
        : null,
    preparePayment,
  })

  const lines = useCheckoutOrderLines(summary, upsellState.upsellSummaryItems, { tickets, tiers: eventPriceTiers, upsells, participants })
  const pricingNotices = [
    ...(checkout.error ? [pricingErrorMessage(checkout.error)] : []),
    ...(checkout.pricing?.rejections ?? []).map(promoRejectionMessage),
  ]
  const sellingTier = eventPriceTiers.find((tier) => tier.id === checkout.sellingTierId) ?? null
  const upsellCount = upsellState.upsellSummaryItems.reduce((sum, item) => sum + item.quantity, 0)
  const hasFlexible = flexibleBySlot.some(Boolean)
  const isBusy = isCreating || submission.isSubmitting || authReason !== null

  useAddToCartTracking({ event, ticketSelections, participantCount: totalParticipants, totalCents: summary.totalDue, currency })

  // Apply the SAS chosen on the event page once, to the participant holding that ticket.
  const initialWaveAppliedRef = useRef(false)
  useEffect(() => {
    if (initialWaveAppliedRef.current || !initialWaveIndex || !initialTicketId) return
    const target = participants.find((participant) => participant.ticketId === initialTicketId)
    if (!target) return
    initialWaveAppliedRef.current = true
    handleWaveSelection(target.id, initialWaveIndex)
  }, [participants, initialWaveIndex, initialTicketId, handleWaveSelection])

  // Guide the visitor to the participants the first time a ticket is chosen.
  const hasScrolledRef = useRef(false)
  useEffect(() => {
    if (hasScrolledRef.current || totalParticipants === 0) return
    hasScrolledRef.current = true
    participantsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [totalParticipants])

  // Signed in from the dialog: close it; the submission resumes on its own when it was for paying.
  useEffect(() => {
    if (user) setAuthReason(null)
  }, [user])

  const handleAuthenticated = () => {
    // The page keys this query by the route param (slug or id): match it on its marker.
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'events' && query.queryKey[2] === 'register-data',
    })
  }

  const payButton = <PayButton className="w-full" isBusy={isBusy} onPayment={submission.submit} />
  const hasUpsells = upsells.length > 0

  return (
    <section className="mx-auto w-full space-y-8 pb-28 pt-6 lg:pb-12">
      <RegistrationHeader event={event} availableSpots={availableSpots} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:gap-12">
        <div className="min-w-0 space-y-6">
          <GroupPanel
            user={user}
            event={event}
            group={myGroup}
            intent={groupIntent ?? pendingGroupIntent}
            inviteCode={inviteCode}
            onNeedAuth={(intent) => {
              setPendingGroupIntent(intent)
              setAuthReason('group')
            }}
          />

          <div className="divide-y divide-border">
            <RegistrationSection index={1} title="Tes billets" isComplete={validation.sections.tickets}>
              <TicketSelectionStep
                tickets={tickets}
                ticketSelections={ticketSelections}
                onTicketQuantityChange={handleTicketQuantityChange}
                defaultCurrency={currency}
                sellingTier={sellingTier}
                availableSpots={availableSpots}
                showErrors={showErrors}
              />
            </RegistrationSection>

            {totalParticipants > 0 ? (
              <RegistrationSection
                index={2}
                title={totalParticipants > 1 ? 'Les participants' : 'Le participant'}
                isComplete={validation.sections.participants}
                sectionRef={participantsSectionRef}
              >
                <ParticipantsStep
                  eventId={event.id}
                  participants={participants}
                  ticketMap={ticketMap}
                  onFieldChange={handleParticipantChange}
                  onWaveSelect={handleWaveSelection}
                  errorsByParticipant={showErrors ? validation.participantErrors : {}}
                  completeById={completeById}
                  groupAnchor={groupAnchor}
                />
              </RegistrationSection>
            ) : null}

            {totalParticipants > 0 && hasUpsells ? (
              <RegistrationSection index={3} title="Options" optional>
                <OptionsStep
                  upsells={upsells}
                  selectedUpsells={upsellState.selectedUpsells}
                  participants={participants}
                  defaultCurrency={currency}
                  onSetForParticipant={upsellState.setUpsellForParticipant}
                  onSetForAll={upsellState.setUpsellForAll}
                  onClear={upsellState.clearUpsell}
                  onSizeForAll={upsellState.setUpsellSizeForAll}
                />
              </RegistrationSection>
            ) : null}

            {totalParticipants > 0 ? (
              <RegistrationSection index={hasUpsells ? 4 : 3} title="Décharge et signature" isComplete={validation.sections.confirmation}>
                <ConfirmationStep
                  disclaimerRead={consents.disclaimerRead}
                  disclaimerAccepted={consents.disclaimerAccepted}
                  rulebookAccepted={consents.rulebookAccepted}
                  signatureImage={consents.signatureImage}
                  showErrors={showErrors}
                  onDisclaimerReadChange={setConsent('disclaimerRead')}
                  onDisclaimerAcceptedChange={setConsent('disclaimerAccepted')}
                  onRulebookAcceptedChange={setConsent('rulebookAccepted')}
                  onSignatureChange={setSignature}
                  groupAttestation={needsGroupAttestation ? consents.groupAttestation : undefined}
                  onGroupAttestationChange={setConsent('groupAttestation')}
                />
              </RegistrationSection>
            ) : null}
          </div>
        </div>

        {/* Always in view while the form scrolls; scrolls on its own if taller than the screen. */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          <OrderSummarySidebar
            lines={lines}
            totalCents={summary.totalDue}
            currency={summary.currency}
            hasFlexible={hasFlexible}
            ticketCount={totalParticipants}
            upsellCount={upsellCount}
            groupDiscountPercent={summary.groupDiscount?.applied ? summary.groupDiscount.percent : null}
            pricingNotices={pricingNotices}
            appliedPromos={promo.appliedPromos}
            promoInput={promo.promoInput}
            promoError={promo.promoError}
            onPromoInputChange={promo.setPromoInput}
            onValidatePromo={promo.validatePromoCode}
            onRemovePromo={promo.removePromo}
            submissionMessage={submission.message}
            payAction={payButton}
          />
        </aside>
      </div>

      <RegistrationPaymentBar
        totalCents={summary.totalDue}
        currency={summary.currency}
        ticketCount={totalParticipants}
        upsellCount={upsellCount}
        detail={lines.length > 0 ? <OrderLines lines={lines} currency={summary.currency} /> : undefined}
        hasFlexible={hasFlexible}
        isBusy={isBusy}
        submissionMessage={submission.message}
        onPayment={submission.submit}
      />

      <Dialog open={authReason !== null} onOpenChange={(open) => !open && setAuthReason(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Connexion requise</DialogTitle>
          <InlineAuthStep onAuthenticated={handleAuthenticated} />
        </DialogContent>
      </Dialog>
    </section>
  )
}
