'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ACCOUNT_REGISTRATIONS_QUERY_KEY } from '@/app/api/account/registrations/accountRegistrationsQueries'
import ConfirmationStep from '@/components/registration/ConfirmationStep'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { REGULATION_VERSION } from '@/constants/registration'
import { HEALTH_DATA_CONSENT_LABEL, needsHealthDataConsent } from '@/lib/legal/healthData'
import { isAdultAt } from '@/lib/tickets/transferClaim'

interface ClaimTicketFormProps {
  token: string
  defaultFirstName?: string
  defaultLastName?: string
}

const emptyIdentity = {
  birthDate: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalInfo: '',
}

/**
 * Receiving a bib means taking over the participation: the new holder states who
 * they are and signs the waiver themselves — the buyer's signature does not cover them.
 */
export function ClaimTicketForm({ token, defaultFirstName = '', defaultLastName = '' }: ClaimTicketFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [firstName, setFirstName] = useState(defaultFirstName)
  const [lastName, setLastName] = useState(defaultLastName)
  const [identity, setIdentity] = useState(emptyIdentity)
  const [disclaimerRead, setDisclaimerRead] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [rulebookAccepted, setRulebookAccepted] = useState(false)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [healthDataConsent, setHealthDataConsent] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const setField = (field: keyof typeof emptyIdentity) => (value: string) =>
    setIdentity((current) => ({ ...current, [field]: value }))

  const missing = (value: string) => showErrors && !value.trim()
  const isMinor = Boolean(identity.birthDate) && !isAdultAt(identity.birthDate, new Date())
  const complete =
    firstName.trim() &&
    lastName.trim() &&
    identity.birthDate &&
    identity.emergencyContactName.trim() &&
    identity.emergencyContactPhone.trim() &&
    (!needsHealthDataConsent(identity.medicalInfo) || healthDataConsent) &&
    disclaimerRead &&
    disclaimerAccepted &&
    rulebookAccepted &&
    signatureImage

  const handleClaim = () => {
    setError(null)
    if (!complete || isMinor) {
      setShowErrors(true)
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch('/api/account/tickets/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            token,
            participant: { firstName, lastName, ...identity, healthDataConsent },
            signatureImage,
            signatureMetadata: { regulationVersion: REGULATION_VERSION, signedAt: new Date().toISOString() },
            disclaimer: { read: disclaimerRead, accepted: disclaimerAccepted, rulebookAccepted },
          }),
        })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || 'Impossible de récupérer ce billet.')
        }

        setSuccess(true)
        // The claimed bib must show on the home screen immediately, not after the cache goes stale.
        await queryClient.invalidateQueries({ queryKey: ACCOUNT_REGISTRATIONS_QUERY_KEY })
        router.prefetch('/account')
        setTimeout(() => {
          router.push('/account')
          router.refresh()
        }, 1500)
      } catch (claimError) {
        setError(claimError instanceof Error ? claimError.message : "Une erreur inattendue s'est produite.")
      }
    })
  }

  const fieldClass = (invalid: boolean) => (invalid ? 'border-destructive' : '')

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-black tracking-tight">Qui court ?</h2>
          <p className="text-sm text-muted-foreground">
            Le dossard sera à ton nom. Ces informations remplacent celles de la personne qui te l&apos;a transmis.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="claim-first-name">Prénom *</Label>
            <Input id="claim-first-name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={fieldClass(missing(firstName))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-last-name">Nom *</Label>
            <Input id="claim-last-name" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldClass(missing(lastName))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-birth-date">Date de naissance *</Label>
            <Input id="claim-birth-date" type="date" autoComplete="bday" value={identity.birthDate} onChange={(e) => setField('birthDate')(e.target.value)} className={fieldClass(missing(identity.birthDate) || isMinor)} />
            {isMinor ? <p className="text-xs text-destructive">Participation réservée aux personnes majeures.</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-emergency-name">Contact d&apos;urgence *</Label>
            <Input id="claim-emergency-name" value={identity.emergencyContactName} onChange={(e) => setField('emergencyContactName')(e.target.value)} className={fieldClass(missing(identity.emergencyContactName))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-emergency-phone">Téléphone du contact *</Label>
            <Input id="claim-emergency-phone" type="tel" autoComplete="tel" value={identity.emergencyContactPhone} onChange={(e) => setField('emergencyContactPhone')(e.target.value)} className={fieldClass(missing(identity.emergencyContactPhone))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="claim-medical">Informations médicales utiles (facultatif)</Label>
          <Textarea id="claim-medical" rows={2} value={identity.medicalInfo} onChange={(e) => setField('medicalInfo')(e.target.value)} />
          {needsHealthDataConsent(identity.medicalInfo) ? (
            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="claim-health-consent"
                checked={healthDataConsent}
                onCheckedChange={(checked) => setHealthDataConsent(checked === true)}
                className={showErrors && !healthDataConsent ? 'border-destructive' : ''}
              />
              <Label htmlFor="claim-health-consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
                {HEALTH_DATA_CONSENT_LABEL} Sans cet accord, ces informations ne sont pas enregistrées.
              </Label>
            </div>
          ) : null}
        </div>
        <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          <li>Préviens ton contact d&apos;urgence que tu donnes ses coordonnées à Overbound.</li>
          <li>Le jour J, une pièce d&apos;identité à ton nom te sera demandée au retrait du dossard.</li>
          <li>
            L&apos;assurance d&apos;Overbound couvre sa responsabilité, pas tes propres blessures sans faute de sa part : une
            assurance individuelle accident est recommandée (
            <a href="/cgv#responsabilite" target="_blank" rel="noreferrer" className="underline underline-offset-2">
              CGV, article 12
            </a>
            ).
          </li>
          <li>
            Tes données servent à gérer ta participation et ta sécurité (
            <a href="/privacy-policies" target="_blank" rel="noreferrer" className="underline underline-offset-2">
              politique de confidentialité
            </a>
            ).
          </li>
        </ul>
      </section>

      <ConfirmationStep
        disclaimerRead={disclaimerRead}
        disclaimerAccepted={disclaimerAccepted}
        rulebookAccepted={rulebookAccepted}
        signatureImage={signatureImage}
        showErrors={showErrors}
        onDisclaimerReadChange={setDisclaimerRead}
        onDisclaimerAcceptedChange={setDisclaimerAccepted}
        onRulebookAcceptedChange={setRulebookAccepted}
        onSignatureChange={setSignatureImage}
        context="transfer"
      />

      <div className="space-y-3">
        <Button onClick={handleClaim} disabled={isPending || success} className="h-14 w-full text-base font-bold">
          {isPending ? 'Transfert en cours…' : success ? 'Billet transféré !' : 'Signer et récupérer ce billet'}
        </Button>
        {showErrors && !complete ? <p role="alert" className="text-sm text-destructive">Complète tous les champs, coche les cases et signe.</p> : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">Billet récupéré. On t&apos;emmène vers ton dossard…</p> : null}
      </div>
    </div>
  )
}
