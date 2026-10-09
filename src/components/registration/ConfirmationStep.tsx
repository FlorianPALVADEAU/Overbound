'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ShieldAlert } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="mb-1 flex items-center gap-2 text-base font-semibold">
          <ShieldAlert className="h-4 w-4" />
          Décharge de responsabilité & Acceptation du règlement Overbound
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Merci de lire attentivement ce texte avant de signer électroniquement.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/35 bg-primary/5 p-4 text-sm leading-relaxed shadow-sm">
            <p className="font-medium text-foreground">{WAIVER_SUMMARY}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Billets non remboursables à ton initiative, remboursés à l&apos;acheteur si Overbound annule.{' '}
              <a href="/cgv#annulation-participant" className="underline underline-offset-2 hover:text-foreground">
                Consulter les CGV
              </a>
            </p>
            <button
              type="button"
              onClick={() => setIsDisclaimerExpanded((prev) => !prev)}
              className="mt-3 inline-flex rounded-md border border-primary/40 bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              {isDisclaimerExpanded ? 'Masquer' : 'Lire la décharge complète'}
            </button>
            <a
              href={OFFICIAL_RULEBOOK_PDF_PATH}
              target="_blank"
              rel="noreferrer"
              className="mt-3 ml-2 inline-flex rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Lire le règlement complet (PDF)
            </a>

            {isDisclaimerExpanded ? (
              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-md border border-primary/20 bg-background/70 p-3 text-xs leading-relaxed">
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
                    Règlement officiel Overbound (PDF)
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
            <div
              className={`flex items-start gap-3 rounded-md p-2 -m-2 ${showDisclaimerReadError ? 'bg-destructive/10' : ''}`}
            >
              <Checkbox
                id="disclaimer-read"
                checked={disclaimerRead}
                onCheckedChange={(checked) => onDisclaimerReadChange(checked === true)}
                className={showDisclaimerReadError ? 'border-destructive' : ''}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="disclaimer-read"
                  className={`text-sm leading-relaxed ${showDisclaimerReadError ? 'text-destructive' : ''}`}
                >
                  J&apos;ai lu et compris l&apos;intégralité de la décharge de responsabilité.{' '}
                  <span className="text-destructive">*</span>
                </Label>
                {showDisclaimerReadError && (
                  <p className="text-xs text-destructive">Ce champ est obligatoire.</p>
                )}
              </div>
            </div>
            <div
              className={`flex items-start gap-3 rounded-md p-2 -m-2 ${showRulebookAcceptedError ? 'bg-destructive/10' : ''}`}
            >
              <Checkbox
                id="rulebook-accepted"
                checked={rulebookAccepted}
                onCheckedChange={(checked) => onRulebookAcceptedChange(checked === true)}
                className={showRulebookAcceptedError ? 'border-destructive' : ''}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="rulebook-accepted"
                  className={`text-sm leading-relaxed ${showRulebookAcceptedError ? 'text-destructive' : ''}`}
                >
                  J&apos;ai lu et compris l&apos;intégralité du règlement officiel Overbound.{' '}
                  <span className="text-destructive">*</span>
                </Label>
                {showRulebookAcceptedError && (
                  <p className="text-xs text-destructive">Ce champ est obligatoire.</p>
                )}
              </div>
            </div>
            <div
              className={`flex items-start gap-3 rounded-md p-2 -m-2 ${showDisclaimerAcceptedError ? 'bg-destructive/10' : ''}`}
            >
              <Checkbox
                id="disclaimer-accepted"
                checked={disclaimerAccepted}
                onCheckedChange={(checked) => onDisclaimerAcceptedChange(checked === true)}
                className={showDisclaimerAcceptedError ? 'border-destructive' : ''}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="disclaimer-accepted"
                  className={`text-sm leading-relaxed ${showDisclaimerAcceptedError ? 'text-destructive' : ''}`}
                >
                  J&apos;accepte la décharge ci-dessus.{' '}
                  <span className="text-destructive">*</span>
                </Label>
                {showDisclaimerAcceptedError && (
                  <p className="text-xs text-destructive">Ce champ est obligatoire.</p>
                )}
              </div>
            </div>
            {showGroupAttestation ? (
              <div
                className={`flex items-start gap-3 rounded-md p-2 -m-2 ${showGroupAttestationError ? 'bg-destructive/10' : ''}`}
              >
                <Checkbox
                  id="group-attestation"
                  checked={groupAttestation === true}
                  onCheckedChange={(checked) => onGroupAttestationChange?.(checked === true)}
                  className={showGroupAttestationError ? 'border-destructive' : ''}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="group-attestation"
                    className={`text-sm leading-relaxed ${showGroupAttestationError ? 'text-destructive' : ''}`}
                  >
                    J&apos;inscris d&apos;autres personnes : j&apos;atteste agir avec leur accord, leur avoir transmis la
                    décharge, le règlement et les CGV, et je me porte fort de leur acceptation.{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  {showGroupAttestationError && <p className="text-xs text-destructive">Ce champ est obligatoire.</p>}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`rounded-lg border p-4 ${showSignatureError ? 'border-destructive' : ''}`}>
        <div className="mb-1 flex items-center gap-2 text-base font-semibold">
          Signature manuscrite <span className="text-destructive">*</span>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Dessinez votre signature comme sur un document officiel. Elle sera jointe à votre dossier.
        </p>
        <div className="space-y-3">
          <div
            className={`rounded-lg ${showSignatureError ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
          >
            <SignaturePad onChange={onSignatureChange} />
          </div>
          {showSignatureError && (
            <p className="text-xs text-destructive font-medium">
              Veuillez dessiner votre signature pour continuer.
            </p>
          )}
          {context === 'purchase' ? (
            <>
              <p className="text-xs text-muted-foreground">
                Pour courir ensemble dans le même SAS, tous les participants doivent être inscrits dans
                une seule commande.
              </p>
              <p className="text-xs text-muted-foreground">
                Une fois cette étape validée, vous serez redirigé vers la page de paiement sécurisé Stripe.
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
