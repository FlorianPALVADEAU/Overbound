import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ShieldAlert } from 'lucide-react'
import SignaturePad from '@/components/forms/SignaturePad'

interface ConfirmationStepProps {
  disclaimerRead: boolean
  disclaimerAccepted: boolean
  signatureImage: string | null
  showErrors: boolean
  onDisclaimerReadChange: (checked: boolean) => void
  onDisclaimerAcceptedChange: (checked: boolean) => void
  onSignatureChange: (image: string | null) => void
}

export default function ConfirmationStep({
  disclaimerRead,
  disclaimerAccepted,
  signatureImage,
  showErrors,
  onDisclaimerReadChange,
  onDisclaimerAcceptedChange,
  onSignatureChange,
}: ConfirmationStepProps) {
  const showDisclaimerReadError = showErrors && !disclaimerRead
  const showDisclaimerAcceptedError = showErrors && !disclaimerAccepted
  const showSignatureError = showErrors && !signatureImage

  return (
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
              J&apos;atteste être en condition physique adéquate et disposer des certificats nécessaires le cas échéant.
            </p>
            <p>
              Je dégage Overbound, ses organisateurs, partenaires et bénévoles de toute responsabilité en cas d&apos;accident ou de dommage matériel me concernant.
              Je m&apos;engage à respecter le règlement de l&apos;événement ainsi que les consignes de sécurité communiquées avant et pendant la course.
            </p>
            <p>
              Je comprends que ma sécurité dépend de ma vigilance et m&apos;engage à signaler tout problème de santé susceptible d&apos;altérer ma participation.
            </p>
            <p className="text-muted-foreground">
              Règlements sportifs :
              {' '}
              <a className="underline" href="/documents/OVERBOUND_rulebook_OPEN-2026.pdf" target="_blank" rel="noreferrer">
                OPEN 2026
              </a>
              {' '}
              •
              {' '}
              <a className="underline" href="/documents/OVERBOUND_rulebook_RANKED-2026.pdf" target="_blank" rel="noreferrer">
                RANKED 2026
              </a>
            </p>
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
                  J&apos;accepte sans réserve les conditions ci-dessus et je renonce à tout recours contre
                  Overbound. <span className="text-destructive">*</span>
                </Label>
                {showDisclaimerAcceptedError && (
                  <p className="text-xs text-destructive">Ce champ est obligatoire.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={showSignatureError ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Signature manuscrite <span className="text-destructive">*</span>
          </CardTitle>
          <CardDescription>
            Dessinez votre signature comme sur un document officiel. Elle sera jointe à votre dossier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <p className="text-xs text-muted-foreground">
            Pour courir ensemble dans le même SAS, tous les participants doivent être inscrits dans
            une seule commande.
          </p>
          <p className="text-xs text-muted-foreground">
            Une fois cette étape validée, vous serez redirigé vers la page de paiement sécurisé Stripe.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
