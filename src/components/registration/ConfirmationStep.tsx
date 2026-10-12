'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import SignaturePad from '@/components/forms/SignaturePad'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'
import { WAIVER_CLAUSES, WAIVER_INTRO, WAIVER_SUMMARY, WAIVER_TITLE } from '@/constants/waiver'

interface ConfirmationStepProps {
  disclaimerRead: boolean
  disclaimerAccepted: boolean
  rulebookAccepted: boolean
  signatureImage: string | null
  showErrors: boolean
  onDisclaimerReadChange: (checked: boolean) => void
  onDisclaimerAcceptedChange: (checked: boolean) => void
  onRulebookAcceptedChange: (checked: boolean) => void
  onSignatureChange: (image: string | null) => void
  /** Defined only when the order covers other participants: the buyer must vouch for them. */
  groupAttestation?: boolean
  onGroupAttestationChange?: (checked: boolean) => void
  /** Checkout signs before paying; a transfer signs to take over an existing bib. */
  context?: 'purchase' | 'transfer'
}

export default function ConfirmationStep({
  disclaimerRead,
  disclaimerAccepted,
  rulebookAccepted,
  signatureImage,
  showErrors,
  onDisclaimerReadChange,
  onDisclaimerAcceptedChange,
  onRulebookAcceptedChange,
  onSignatureChange,
  context = 'purchase',
  groupAttestation,
  onGroupAttestationChange,
}: ConfirmationStepProps) {
  const showGroupAttestation = groupAttestation !== undefined
  const showGroupAttestationError = showErrors && showGroupAttestation && !groupAttestation
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false)
  const showDisclaimerReadError = showErrors && !disclaimerRead
  const showDisclaimerAcceptedError = showErrors && !disclaimerAccepted
  const showRulebookAcceptedError = showErrors && !rulebookAccepted
  const showSignatureError = showErrors && !signatureImage

  const consents = [
    {
      id: 'disclaimer-read',
      checked: disclaimerRead,
      error: showDisclaimerReadError,
      onChange: onDisclaimerReadChange,
      label: "J'ai lu et compris la décharge de responsabilité.",
    },
    {
      id: 'rulebook-accepted',
      checked: rulebookAccepted,
      error: showRulebookAcceptedError,
      onChange: onRulebookAcceptedChange,
      label: "J'ai lu et compris le règlement officiel Overbound.",
    },
    {
      id: 'disclaimer-accepted',
      checked: disclaimerAccepted,
      error: showDisclaimerAcceptedError,
      onChange: onDisclaimerAcceptedChange,
      label: "J'accepte la décharge ci-dessus.",
    },
    ...(showGroupAttestation
      ? [
          {
            id: 'group-attestation',
            checked: groupAttestation === true,
            error: showGroupAttestationError,
            onChange: (checked: boolean) => onGroupAttestationChange?.(checked),
            label:
              "J'inscris d'autres personnes : j'atteste agir avec leur accord, leur avoir transmis la décharge, le règlement et les CGV, et je me porte fort de leur acceptation.",
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="rounded-xl bg-muted p-4 text-sm leading-relaxed">
          <p className="font-medium">{WAIVER_SUMMARY}</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={() => setIsDisclaimerExpanded((prev) => !prev)}
              className="min-h-11 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {isDisclaimerExpanded ? 'Masquer la décharge' : 'Lire la décharge complète'}
            </button>
            <a
              href={OFFICIAL_RULEBOOK_PDF_PATH}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Lire le règlement (PDF)
            </a>
          </p>

          {isDisclaimerExpanded ? (
            <div className="mt-2 max-h-80 space-y-3 overflow-y-auto border-t border-border pt-4 text-xs leading-relaxed">
              <p className="font-semibold uppercase">{WAIVER_TITLE}</p>
              <p>{WAIVER_INTRO}</p>
              {WAIVER_CLAUSES.map((clause) => (
                <p key={clause.id}>
                  {clause.id}. {clause.text}
                </p>
              ))}
              <p className="text-muted-foreground">
                Documents utiles :{' '}
                <a className="underline" href={OFFICIAL_RULEBOOK_PDF_PATH} target="_blank" rel="noreferrer">
                  Règlement officiel (PDF)
                </a>
                {' · '}
                <a className="underline" href="/cgv" target="_blank" rel="noreferrer">
                  CGV
                </a>
                {' · '}
                <a className="underline" href="/privacy-policies" target="_blank" rel="noreferrer">
                  Politique de confidentialité
                </a>
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className={`flex items-start gap-3 rounded-lg ${consent.error ? 'bg-destructive/10 p-2 -m-2' : ''}`}
            >
              <Checkbox
                id={consent.id}
                checked={consent.checked}
                onCheckedChange={(checked) => consent.onChange(checked === true)}
                className={`mt-0.5 ${consent.error ? 'border-destructive' : ''}`}
              />
              <div className="space-y-1">
                <Label
                  htmlFor={consent.id}
                  className={`text-sm font-normal leading-relaxed ${consent.error ? 'text-destructive' : ''}`}
                >
                  <span className="block">
                    {consent.label} <span className="text-destructive" aria-hidden>*</span>
                  </span>
                </Label>
                {consent.error ? <p className="text-xs text-destructive">Ce champ est obligatoire.</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-base font-semibold">
            Ta signature <span className="text-destructive" aria-hidden>*</span>
          </p>
          
        </div>
        <div className={`rounded-lg ${showSignatureError ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background' : ''}`}>
          <SignaturePad onChange={onSignatureChange} />
        </div>
        {showSignatureError ? (
          <p className="text-xs font-medium text-destructive">Dessine ta signature pour continuer.</p>
        ) : null}
        {context === 'purchase' ? (
          <p className="text-xs text-muted-foreground">
            Pour courir ensemble dans le même SAS, inscris tous les participants dans une seule commande.
          </p>
        ) : null}
      </div>
    </div>
  )
}
