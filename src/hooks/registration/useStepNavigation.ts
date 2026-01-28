import { useCallback, useState } from 'react'
import { REGISTRATION_STEPS } from '@/constants/registration'
import type { StepKey } from '@/components/registration/types'

interface StepValidation {
  isTicketsStepValid: boolean
  isParticipantsStepValid: boolean
  isConfirmationStepValid: boolean
}

export function useStepNavigation(
  validation: StepValidation,
  ensurePaymentIntent: () => Promise<any>,
) {
  const [stepIndex, setStepIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentStepId: StepKey = REGISTRATION_STEPS[stepIndex]?.id || 'tickets'
  const stepProgress = ((stepIndex + 1) / REGISTRATION_STEPS.length) * 100

  const canContinue = (() => {
    switch (currentStepId) {
      case 'tickets':
        return validation.isTicketsStepValid
      case 'participants':
        return validation.isParticipantsStepValid
      case 'options':
        return true
      case 'confirmation':
        return validation.isConfirmationStepValid
      default:
        return false
    }
  })()

  const proceedToNextStep = useCallback(async () => {
    if (stepIndex === REGISTRATION_STEPS.length - 1) return

    setIsTransitioning(true)

    try {
      if (REGISTRATION_STEPS[stepIndex + 1]?.id === 'confirmation') {
        await ensurePaymentIntent()
      }

      await new Promise((resolve) => setTimeout(resolve, 400))
      setStepIndex((i) => i + 1)
    } catch {
      // Error already handled by ensurePaymentIntent
    } finally {
      setIsTransitioning(false)
    }
  }, [stepIndex, ensurePaymentIntent])

  const goToPreviousStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  return {
    stepIndex,
    setStepIndex,
    currentStepId,
    stepProgress,
    isTransitioning,
    canContinue,
    proceedToNextStep,
    goToPreviousStep,
  }
}
