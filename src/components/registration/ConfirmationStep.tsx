'use client'

import { useState } from 'react'
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
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false)
  const showDisclaimerReadError = showErrors && !disclaimerRead
  const showDisclaimerAcceptedError = showErrors && !disclaimerAccepted
  const showSignatureError = showErrors && !signatureImage

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Décharge de responsabilité Overbound
          </CardTitle>
          <CardDescription>
            Merci de lire attentivement ce texte avant de signer électroniquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-primary/35 bg-primary/5 p-4 text-sm leading-relaxed shadow-sm">
            <p className="font-medium text-foreground">
              En vous inscrivant, vous reconnaissez les risques d&apos;une course d&apos;obstacles, vous
              renoncez à recours contre Overbound dans les limites légales, et vous autorisez
              l&apos;utilisation de votre image dans le cadre de l&apos;événement.
            </p>
            <button
              type="button"
              onClick={() => setIsDisclaimerExpanded((prev) => !prev)}
              className="mt-3 inline-flex rounded-md border border-primary/40 bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              {isDisclaimerExpanded ? 'Masquer' : 'Lire la décharge complète'}
            </button>

            {isDisclaimerExpanded ? (
              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-md border border-primary/20 bg-background/70 p-3 text-xs leading-relaxed">
                <p className="font-semibold uppercase">
                  Décharge de responsabilité, renonciation au droit de poursuivre et autorisation d&apos;utilisation d&apos;image du participant - Overbound
                </p>
                <p>
                  En contrepartie de mon droit à participer à la course et aux activités connexes
                  Overbound, je reconnais, comprends et accepte les points suivants.
                </p>
                <p>
                  1. Je reconnais que la participation à une course d&apos;obstacles comporte des risques
                  importants, incluant notamment chutes, entorses, fractures, blessures liées à la
                  chaleur, au froid, à l&apos;eau, à des obstacles, à des véhicules, à des animaux, à des
                  insectes, à des plantes, ainsi qu&apos;un risque de blessure grave, invalidité, paralysie
                  ou décès.
                </p>
                <p>
                  2. J&apos;assume volontairement et en connaissance de cause l&apos;ensemble de ces risques,
                  connus et inconnus, y compris ceux pouvant résulter d&apos;une négligence d&apos;un tiers.
                </p>
                <p>
                  3. Je m&apos;engage à respecter toutes les règles de sécurité, les consignes des équipes
                  Overbound et le règlement de l&apos;événement. En cas de danger inhabituel, je m&apos;engage à
                  interrompre ma participation et à en informer immédiatement l&apos;organisation.
                </p>
                <p>
                  4. Pour moi-même et mes ayants droit, je décharge et m&apos;engage à ne pas poursuivre
                  Overbound, ses dirigeants, salariés, bénévoles, partenaires, sponsors, prestataires,
                  propriétaires des sites et toute entité liée à l&apos;organisation, pour toute blessure,
                  dommage, invalidité, décès, perte ou casse de biens, dans les limites autorisées par
                  la loi applicable.
                </p>
                <p>
                  5. J&apos;atteste être apte physiquement à participer, ne pas présenter de contre-indication
                  médicale connue, et disposer des documents obligatoires demandés (PPS, certificat,
                  autorisation parentale, etc.).
                </p>
                <p>
                  5bis. <span className="font-semibold">Je certifie être majeur(e) (18 ans révolus).</span>{' '}
                  La participation à cette édition est strictement réservée aux personnes majeures. Les
                  inscriptions de mineurs ne seront pas acceptées. La prochaine édition Overbound
                  sera ouverte aux participants mineurs accompagnés d&apos;un responsable légal.
                </p>
                <p>
                  6. J&apos;autorise l&apos;administration des premiers secours et de tout traitement médical
                  d&apos;urgence jugé nécessaire, et j&apos;accepte d&apos;en assumer les conséquences et coûts.
                </p>
                <p>
                  7. Je reconnais qu&apos;Overbound n&apos;est pas responsable de la perte, du vol, de la casse
                  ou de la dégradation de mes effets personnels.
                </p>
                <p>
                  8. Je reconnais que les frais d&apos;inscription sont soumis aux conditions tarifaires et
                  de remboursement indiquées sur la plateforme Overbound. Sauf mention contraire
                  explicite, l&apos;inscription est nominative et non transférable.
                </p>
                <p>
                  9. Overbound peut reporter, modifier ou annuler un événement pour des raisons de
                  sécurité, météo, force majeure, contraintes administratives, sanitaires ou techniques.
                  Les modalités applicables dans ces cas sont celles publiées dans les CGU/CGV et le
                  règlement de l&apos;événement.
                </p>
                <p>
                  10. J&apos;autorise gratuitement Overbound à capter et utiliser mon nom, image, voix,
                  performance, photographie et vidéo, sur tout support, pour la promotion et la
                  communication des événements, sans limitation géographique ni de durée, et sans
                  compensation financière.
                </p>
                <p>
                  11. Cette autorisation inclut la diffusion par les partenaires médias et commerciaux
                  d&apos;Overbound dans le cadre de la promotion de l&apos;événement et de la marque.
                </p>
                <p>
                  12. En validant mon inscription, je confirme avoir lu et accepté le règlement de course,
                  les CGU/CGV Overbound et les obligations liées au dossard, au chronométrage et au
                  matériel fourni.
                </p>
                <p className="text-muted-foreground">
                  Documents utiles :
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
