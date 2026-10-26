'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import SignaturePad from '@/components/forms/SignaturePad'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'
import { PARTICIPANT_NOTICE } from '@/constants/participantNotice'
import { WAIVER_CLAUSES, WAIVER_INTRO, WAIVER_SUMMARY, WAIVER_TITLE } from '@/constants/waiver'
import { CONSENT_FIELD_IDS } from '@/lib/checkout/fieldIds'

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
      id: CONSENT_FIELD_IDS.disclaimerRead,
      checked: disclaimerRead,
      error: showDisclaimerReadError,
      onChange: onDisclaimerReadChange,
      label: "J'ai lu et compris la décharge de responsabilité.",
    },
    {
      id: CONSENT_FIELD_IDS.rulebookAccepted,
      checked: rulebookAccepted,
      error: showRulebookAcceptedError,
      onChange: onRulebookAcceptedChange,
      label: "J'ai lu et compris le règlement officiel Overbound.",
    },
    {
      id: CONSENT_FIELD_IDS.disclaimerAccepted,
      checked: disclaimerAccepted,
      error: showDisclaimerAcceptedError,
      onChange: onDisclaimerAcceptedChange,
      label: "J'accepte la décharge ci-dessus.",
    },
    ...(showGroupAttestation
      ? [
          {
            id: CONSENT_FIELD_IDS.groupAttestation,
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
    <div className="space-y-4">
      <div className="space-y-3">
        <div
          role="region"
          aria-label="Avant de signer : risques, assurance et tes engagements"
          tabIndex={0}
          className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4"
        >
          <h3 className="text-base font-semibold">Avant de signer : risques, assurance et tes engagements</h3>
          {PARTICIPANT_NOTICE.map((section) => (
            <div key={section.title} className="space-y-1">
              <h4 className="text-sm font-bold">{section.title}</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-snug text-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-primary/40 bg-card p-3 text-foreground sm:p-4">
          <p className="text-base font-medium leading-snug">{WAIVER_SUMMARY}</p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={() => setIsDisclaimerExpanded((prev) => !prev)}
              aria-expanded={isDisclaimerExpanded}
              aria-controls="waiver-full-text"
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
            <div
              id="waiver-full-text"
              role="region"
              aria-label={WAIVER_TITLE}
              tabIndex={0}
              className="mt-2 max-h-96 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3 text-sm leading-snug text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <h4 className="font-semibold uppercase">{WAIVER_TITLE}</h4>
              <p>{WAIVER_INTRO}</p>
              <ol className="space-y-1">
                {WAIVER_CLAUSES.map((clause) => (
                  <li key={clause.id}>
                    <span className="font-bold">{clause.id}.</span> {clause.text}
                  </li>
                ))}
              </ol>
              <p>
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
                . Tu peux demander l’accès, la rectification ou la suppression de tes données à tout moment depuis ton
                compte.
              </p>
            </div>
          ) : null}
        </div>

        <fieldset>
          <legend className="sr-only">Tes engagements</legend>
          {consents.map((consent) => (
            <div key={consent.id}>
              <Label
                htmlFor={consent.id}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-sm font-normal leading-snug text-foreground',
                  consent.error && 'bg-destructive/10 text-destructive',
                )}
              >
                <Checkbox
                  id={consent.id}
                  checked={consent.checked}
                  onCheckedChange={(checked) => consent.onChange(checked === true)}
                  aria-invalid={consent.error}
                  aria-describedby={consent.error ? `${consent.id}-error` : undefined}
                  className={cn(consent.error && 'border-destructive')}
                />
                <span className="block">
                  {consent.label} <span className="text-destructive" aria-hidden>*</span>
                </span>
              </Label>
              {consent.error ? <p id={`${consent.id}-error`} className="px-3 text-sm font-medium text-destructive">Ce champ est obligatoire.</p> : null}
            </div>
          ))}
        </fieldset>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-base font-semibold">
            Ta signature <span className="text-destructive" aria-hidden>*</span>
          </p>
        </div>
        <div
          id={CONSENT_FIELD_IDS.signature}
          tabIndex={-1}
          aria-label="Zone de signature"
          className={`rounded-lg outline-none ${showSignatureError ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background' : ''}`}
        >
          <SignaturePad onChange={onSignatureChange} />
        </div>
        {showSignatureError ? (
          <p className="text-xs font-medium text-destructive">Dessine ta signature pour continuer.</p>
        ) : null}
      </div>
    </div>
  )
}
