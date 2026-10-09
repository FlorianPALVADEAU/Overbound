import type { Metadata } from 'next';
import Link from 'next/link'
import { COMPANY_INFO } from '@/constants/companyInfo'
import { TICKET_TRANSFER_FEE_CENTS, formatTransferFee } from '@/lib/tickets/transferPolicy'
import { FLEXIBLE_REFUND_DEADLINE_DAYS, FLEXIBLE_TICKET_FEE_CENTS } from '@/lib/tickets/flexibleTicket'

const formatFlexibleFee = () =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(FLEXIBLE_TICKET_FEE_CENTS / 100)

export const metadata: Metadata = {
  title: "Conditions Générales de Vente (CGV) - Billetterie | Overbound Race",
  description: "Conditions de vente Overbound Race : tarifs, paiement, annulation, transfert de dossard, droit de rétractation. Vente de billets pour courses d'obstacles OCR.",
  alternates: {
    canonical: 'https://overbound-race.com/cgv'
  },
  robots: {
    index: true,
    follow: true,
  }
};

const lastUpdated = '09/10/2026'

const toc = [
  { id: 'intro', label: '1. Objet et acceptation' },
  { id: 'mentions-legales', label: '2. Identification du vendeur' },
  { id: 'services', label: '3. Services proposés' },
  { id: 'inscription', label: '4. Modalités d\'inscription' },
  { id: 'tarifs', label: '5. Tarifs et frais' },
  { id: 'paiement', label: '6. Modalités de paiement' },
  { id: 'retractation', label: '7. Droit de rétractation' },
  { id: 'transfert', label: '8. Transfert de dossard (cession)' },
  { id: 'annulation-organisateur', label: '9. Annulation, report ou modification par l\'organisateur' },
  { id: 'annulation-participant', label: '10. Annulation par le participant et billet flexible' },
  { id: 'conditions-participation', label: '11. Conditions de participation' },
  { id: 'responsabilite', label: '12. Responsabilité et assurances' },
  { id: 'litiges', label: '13. Litiges et médiation' },
  { id: 'loi', label: '14. Loi applicable' },
]

export default function CGVPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Conditions Générales de Vente
          </h1>
          <p className="text-lg text-muted-foreground">
            Conditions applicables à l'achat de billets et inscriptions aux événements Overbound
          </p>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : <time dateTime="2026-10-09">{lastUpdated}</time>
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">Sommaire</h2>
              <ul className="space-y-2 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground transition hover:text-primary"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert sm:prose lg:prose-lg">
            {/* 1. Objet */}
            <section id="intro" className="mb-12">
              <h2 className="text-2xl font-bold">1. Objet et acceptation</h2>
              <p>
                Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent la vente de billets et
                d'inscriptions aux événements sportifs proposés sur la plateforme Overbound accessible à l'adresse{' '}
                <Link href="/" className="text-primary hover:underline">
                  https://overbound-race.com
                </Link>
                .
              </p>
              <p>
                En procédant à l'achat d'un billet ou d'une inscription, l'acheteur reconnaît avoir pris connaissance
                des présentes CGV et les accepter sans réserve. La personne qui reçoit un dossard par transfert les
                accepte à son tour au moment où elle le récupère (article 8).
              </p>
              <p>
                Ces CGV prévalent sur toute autre version ou tout autre document contradictoire. Overbound se réserve
                le droit de modifier les CGV à tout moment, les conditions applicables étant celles en vigueur à la
                date de la commande.
              </p>
            </section>

            {/* 2. Identification */}
            <section id="mentions-legales" className="mb-12">
              <h2 className="text-2xl font-bold">2. Identification du vendeur</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Vendeur :</strong> {COMPANY_INFO.legalName}, exploitant la marque {COMPANY_INFO.tradeName} (ci-après « Overbound »)
                </p>
                <p>
                  <strong>Forme juridique :</strong> {COMPANY_INFO.legalForm} au capital de {COMPANY_INFO.capital}
                </p>
                <p>
                  <strong>Siège social :</strong> {COMPANY_INFO.address.full}
                </p>
                <p>
                  <strong>RCS :</strong> {COMPANY_INFO.rcs.full}
                </p>
                <p>
                  <strong>TVA intracommunautaire :</strong> {COMPANY_INFO.vat}
                </p>
                <p>
                  <strong>Contact :</strong>{' '}
                  <Link href={`mailto:${COMPANY_INFO.contact.email}`} className="text-primary hover:underline">
                    {COMPANY_INFO.contact.email}
                  </Link>{' '}
                  – Tél : {COMPANY_INFO.contact.phone}
                </p>
              </div>
            </section>

            {/* 3. Services */}
            <section id="services" className="mb-12">
              <h2 className="text-2xl font-bold">3. Services proposés</h2>
              <p>Overbound propose la vente de billets et inscriptions pour :</p>
              <ul>
                <li>Des courses d'obstacles (OCR) de différents formats et niveaux</li>
                <li>Des événements sportifs hybrides (trail, course urbaine, course nature)</li>
                <li>Des sessions d'entraînement et workshops</li>
                <li>Des événements spéciaux (Backyard Ultra, Kids OCR, etc.)</li>
              </ul>
              <p>
                Chaque événement est décrit dans une fiche détaillée précisant : le format, la distance, le niveau de
                difficulté, les obstacles, la date, le lieu, les horaires et les tarifs.
              </p>
            </section>

            {/* 4. Inscription */}
            <section id="inscription" className="mb-12">
              <h2 className="text-2xl font-bold">4. Modalités d'inscription</h2>
              <p>
                <strong>Conditions d'âge :</strong> la participation aux événements payants de l'édition 2026 est
                réservée aux personnes majeures (18 ans révolus à la date de l'événement). Les conditions d'âge des
                éditions suivantes sont précisées sur la page de chaque événement.
              </p>
              <p>
                <strong>Création de compte :</strong> L'inscription nécessite la création d'un compte personnel avec
                des informations exactes et à jour. L'acheteur s'engage à fournir des informations véridiques.
              </p>
              <p>
                <strong>Commande pour plusieurs participants :</strong> l'acheteur qui inscrit d'autres personnes
                déclare agir avec leur accord. Il s'engage à leur transmettre, avant l'événement, les présentes CGV, le
                règlement de l'événement et la décharge de responsabilité, et à s'assurer qu'elles en acceptent les
                termes. Chaque participant reste tenu de respecter ces documents.
              </p>
            </section>

            {/* 5. Tarifs */}
            <section id="tarifs" className="mb-12">
              <h2 className="text-2xl font-bold">5. Tarifs et frais</h2>
              <p>
                <strong>Prix affichés :</strong> Tous les prix sont affichés en euros (€) toutes taxes comprises (TTC).
              </p>
              <p>
                <strong>Frais de dossier :</strong> Les prix comprennent les frais de dossier Overbound, sauf mention
                contraire.
              </p>
              <p>
                <strong>Frais de paiement :</strong> Des frais supplémentaires peuvent s'appliquer selon le mode de
                paiement choisi (carte bancaire, virement SEPA).
              </p>
              <p>
                <strong>Tarification progressive :</strong> Les prix peuvent évoluer selon des paliers tarifaires
                (early bird, tarif normal, tarif tardif) ou selon la disponibilité des places.
              </p>
              <p>
                <strong>Prix ferme :</strong> Le prix applicable est celui en vigueur au moment de la validation de la
                commande.
              </p>
            </section>

            {/* 6. Paiement */}
            <section id="paiement" className="mb-12">
              <h2 className="text-2xl font-bold">6. Modalités de paiement</h2>
              <p>
                <strong>Moyens de paiement acceptés :</strong>
              </p>
              <ul>
                <li>Carte bancaire (Visa, Mastercard, American Express)</li>
                <li>Virement SEPA (selon disponibilité)</li>
              </ul>
              <p>
                <strong>Sécurisation :</strong> Les paiements sont sécurisés par notre prestataire Stripe Payments
                Europe Ltd. Les transactions bénéficient du chiffrement SSL/TLS. Overbound ne conserve aucune donnée
                bancaire complète.
              </p>
              <p>
                <strong>Validation de la commande :</strong> La commande est validée après confirmation du paiement.
                Une confirmation est envoyée par email avec le récapitulatif de l'achat.
              </p>
              <p>
                <strong>Facturation :</strong> Une facture électronique est délivrée et accessible depuis l'espace
                personnel. Les organisations peuvent demander une facture professionnelle à{' '}
                <Link href={`mailto:${COMPANY_INFO.emails.billing}`} className="text-primary hover:underline">
                  {COMPANY_INFO.emails.billing}
                </Link>
                .
              </p>
              <p>
                <strong>Paiement échelonné :</strong> En cas de paiement en plusieurs fois, le défaut de paiement
                d'une échéance entraîne l'annulation de l'inscription après relance restée sans réponse sous 7 jours.
              </p>
            </section>

            {/* 7. Rétractation */}
            <section id="retractation" className="mb-12">
              <h2 className="text-2xl font-bold">7. Droit de rétractation</h2>
              <p>
                <strong>Exclusion du droit de rétractation :</strong> Conformément à l'article L221-28 12° du Code de
                la consommation, les inscriptions à des activités sportives à date déterminée sont exclues du droit de
                rétractation de 14 jours.
              </p>
              <p>
                En validant votre inscription, vous reconnaissez et acceptez expressément cette exclusion du droit de
                rétractation.
              </p>
            </section>

            {/* 8. Transfert */}
            <section id="transfert" className="mb-12">
              <h2 className="text-2xl font-bold">8. Transfert de dossard (cession de l'inscription)</h2>
              <p>
                <strong>8.1 Principe.</strong> Overbound autorise par avance, au sens de l'article 1216 du Code civil,
                le titulaire d'un dossard (le « cédant ») à céder son inscription à une autre personne (le
                « bénéficiaire »). Le transfert s'effectue uniquement depuis l'espace personnel de la plateforme
                Overbound.
              </p>
              <p>
                <strong>8.2 Frais.</strong> Le transfert est soumis à des frais de {formatTransferFee(TICKET_TRANSFER_FEE_CENTS)} TTC,
                payés par le cédant avant l'activation du lien de transfert, une seule fois par dossard. Ce service est
                exécuté immédiatement après le paiement, à la demande expresse du cédant, qui renonce à son droit de
                rétractation (article L221-28 1° du Code de la consommation). Les frais de transfert ne sont pas
                remboursables, y compris en cas d'annulation de l'événement.
              </p>
              <p>
                <strong>8.3 Conditions.</strong> Le bénéficiaire doit remplir les conditions de participation
                (article 11), disposer d'un compte Overbound, renseigner son identité et un contact d'urgence, signer
                personnellement la décharge de responsabilité et accepter le règlement de l'événement, les CGU et les
                présentes CGV. Le transfert est possible jusqu'à la veille de l'événement. Un dossard ne peut être
                transféré qu'une seule fois.
              </p>
              <p>
                <strong>8.4 Effets.</strong> La cession prend effet au moment où le bénéficiaire signe et récupère le
                dossard ; cette signature électronique constitue l'écrit qui constate la cession. Le bénéficiaire
                devient seul titulaire de l'inscription et seul participant autorisé. Overbound libère expressément le
                cédant, pour l'avenir, de ses obligations de participant (article 1216-1 du Code civil). Le cédant perd
                tout droit sur le dossard : son QR code d'accès est désactivé. Chacune des deux parties reçoit une
                confirmation écrite du transfert.
              </p>
              <p>
                <strong>8.5 Paiement et remboursement.</strong> Le contrat de vente (prix payé, facture) reste au nom
                de l'acheteur d'origine. Si un remboursement est dû, notamment en cas d'annulation de l'événement
                (article 9), il est versé à l'acheteur d'origine sur le moyen de paiement utilisé lors de l'achat. Les
                arrangements financiers entre le cédant et le bénéficiaire relèvent de leur seule responsabilité ;
                Overbound n'y est pas partie.
              </p>
              <p>
                <strong>8.6 Revente interdite.</strong> La revente d'un dossard à un prix supérieur au prix payé, sa
                mise en vente sur une plateforme de revente ou sa cession à titre habituel sont interdites (article
                313-6-2 du Code pénal). Overbound peut refuser ou annuler, sans remboursement, un transfert réalisé en
                violation de cette règle, en cas de fraude, d'identité incomplète ou inexacte, de non-respect des
                conditions de participation ou de risque pour la sécurité.
              </p>
              <p>
                <strong>8.7 Après la veille de l'événement.</strong> Aucun transfert n'est possible, sauf accord écrit
                exceptionnel d'Overbound. Pour toute difficulté, contactez{' '}
                <Link href={`mailto:${COMPANY_INFO.emails.support}`} className="text-primary hover:underline">
                  {COMPANY_INFO.emails.support}
                </Link>
                .
              </p>
            </section>

            {/* 9. Annulation organisateur */}
            <section id="annulation-organisateur" className="mb-12">
              <h2 className="text-2xl font-bold">9. Annulation, report ou modification par l'organisateur</h2>
              <p>
                <strong>9.1 Annulation.</strong> Si Overbound annule l'événement, quelle qu'en soit la cause, y compris
                un cas de force majeure ou une décision administrative, le prix du billet et des options non fournies
                est remboursé à l'acheteur d'origine, sur le moyen de paiement utilisé, dans un délai de 30 jours à
                compter de l'annonce de l'annulation. Les frais de transfert de dossard, qui rémunèrent un service déjà
                exécuté, ne sont pas remboursés.
              </p>
              <p>
                <strong>9.2 Report.</strong> En cas de report à une autre date, l'inscription reste valable pour la
                nouvelle date sans démarche. L'acheteur d'origine qui ne souhaite pas participer à la nouvelle date
                peut demander le remboursement dans les 30 jours suivant l'annonce du report, par email à{' '}
                <Link href={`mailto:${COMPANY_INFO.emails.support}`} className="text-primary hover:underline">
                  {COMPANY_INFO.emails.support}
                </Link>
                .
              </p>
              <p>
                <strong>9.3 Adaptation.</strong> Pour des raisons de sécurité, de météo ou sur demande d'une autorité,
                Overbound peut adapter le parcours, les obstacles, les horaires ou les SAS de départ, ou interrompre
                une épreuve en cours. Ces adaptations ne donnent pas lieu à remboursement lorsque l'événement se tient
                à la date et au lieu prévus.
              </p>
              <p>
                <strong>9.4 Indemnisation.</strong> En cas de force majeure, aucune indemnité autre que le
                remboursement prévu au 9.1 n'est due (article 1218 du Code civil). En dehors de ce cas, les droits du
                consommateur à réparation s'appliquent dans les conditions du droit commun. Les participants sont
                informés par email de toute annulation, report ou adaptation significative.
              </p>
            </section>

            {/* 10. Annulation participant */}
            <section id="annulation-participant" className="mb-12">
              <h2 className="text-2xl font-bold">10. Annulation par le participant</h2>
              <p>
                <strong>Principe :</strong> sauf option « billet flexible » (ci-dessous), les inscriptions sont
                définitives et ne donnent lieu à aucun remboursement, avoir ni compensation volontaire, quelle que soit
                la raison invoquée par le participant.
              </p>
              <p>
                Cette règle inclut notamment les empêchements personnels, blessures, situations médicales,
                changements de disponibilité et toute autre circonstance exceptionnelle. Elle s'applique sans
                préjudice des droits impératifs éventuellement prévus par la loi applicable.
              </p>
              <p>
                Le transfert de dossard reste possible dans les conditions prévues à l'article 8 ; il ne constitue pas
                un remboursement.
              </p>
              <h3 id="billet-flexible" className="text-xl font-semibold">Option « billet flexible »</h3>
              <p>
                <strong>Principe :</strong> lors de la commande, l'acheteur peut ajouter, pour chaque participant,
                l'option « billet flexible » au prix fixe de {formatFlexibleFee()} TTC par billet. Cette option permet
                d'annuler le billet concerné et d'en obtenir le remboursement, <strong>sans avoir à justifier d'un
                motif</strong>, jusqu'à {FLEXIBLE_REFUND_DEADLINE_DAYS} jours avant la date de l'événement. Elle constitue
                une modalité tarifaire du billet et non un contrat d'assurance.
              </p>
              <p>
                <strong>Montant remboursé :</strong> le prix effectivement payé pour ce billet, après déduction des
                réductions et codes promotionnels appliqués à la commande, réparties entre les billets au prorata de leur
                prix. Le prix de l'option billet flexible, les autres options (textile, photos…) et les frais de transfert
                éventuels ne sont pas remboursés.
              </p>
              <p>
                <strong>Modalités :</strong> l'annulation se fait depuis l'espace personnel, par l'acheteur d'origine,
                tant qu'il est titulaire du billet. Le remboursement est effectué sur le moyen de paiement utilisé lors
                de l'achat ; une confirmation est envoyée par email. L'annulation est définitive : le dossard et son QR
                code sont supprimés et la place est remise en vente.
              </p>
              <p>
                <strong>Exclusions :</strong> l'option n'est plus utilisable après le délai ci-dessus, après la
                validation du billet au contrôle d'accès, ni lorsque le billet a été transféré (article 8) : le
                transfert fait perdre l'option. En cas d'annulation de l'événement par Overbound, l'article 9
                s'applique ; le prix de l'option n'est alors pas remboursé, le service de flexibilité ayant été fourni
                jusqu'à cette date.
              </p>
            </section>

            {/* 11. Conditions participation */}
            <section id="conditions-participation" className="mb-12">
              <h2 className="text-2xl font-bold">11. Conditions de participation</h2>
              <p>
                <strong>Âge :</strong> la participation à l'édition 2026 est réservée aux personnes majeures. Aucun
                dossard ne peut être transféré à une personne mineure.
              </p>
              <p>
                <strong>Aptitude physique :</strong> chaque participant certifie disposer d'une condition physique
                compatible avec une course à obstacles et ne pas avoir connaissance d'une contre-indication médicale.
              </p>
              <p>
                <strong>Justificatif de santé :</strong> Overbound peut exiger, pour tout ou partie des formats, la
                présentation d'un Pass Prévention Santé (PPS), d'une licence sportive ou d'un certificat médical. Cette
                exigence est indiquée sur la page de l'événement et dans son règlement ; à défaut de justificatif, le
                départ peut être refusé sans remboursement.
              </p>
              <p>
                <strong>Décharge signée :</strong> chaque participant signe personnellement la décharge de
                responsabilité. La signature d'une autre personne ne vaut pas pour lui.
              </p>
              <p>
                <strong>Identité :</strong> le dossard est personnel. Une pièce d'identité est demandée au retrait du
                dossard. Overbound peut refuser le départ si l'identité présentée ne correspond pas à celle du
                titulaire du dossard.
              </p>
              <p>
                <strong>Équipements obligatoires :</strong> le port d'équipements adaptés (chaussures de trail ou
                running, protections) peut être vérifié. Le non-respect entraîne une mise hors course sans
                remboursement.
              </p>
              <p>
                <strong>Règlement sportif :</strong> chaque participant s'engage à respecter le règlement sportif de
                l'événement, le briefing de sécurité et les instructions des organisateurs.
              </p>
            </section>

            {/* 12. Responsabilité */}
            <section id="responsabilite" className="mb-12">
              <h2 className="text-2xl font-bold">12. Responsabilité et assurances</h2>
              <p>
                <strong>Responsabilité d'Overbound :</strong> Overbound met en œuvre les moyens nécessaires à la
                sécurité des participants (parcours, obstacles, encadrement, secours). Elle répond des dommages causés
                par sa faute dans les conditions du droit commun. Aucune stipulation des présentes CGV ne limite la
                réparation d'un dommage corporel causé par une faute d'Overbound.
              </p>
              <p>
                <strong>Limites :</strong> Overbound n'est pas responsable :
              </p>
              <ul>
                <li>Des dommages résultant des risques normaux et inhérents à la pratique d'une course à obstacles, en l'absence de faute de sa part</li>
                <li>Des dommages causés par le participant lui-même, par un autre participant ou par un tiers, sous réserve de sa propre faute</li>
                <li>Des dommages résultant d'un cas de force majeure</li>
                <li>Des prestations vendues directement par des partenaires tiers</li>
                <li>Des erreurs de saisie commises par l'acheteur</li>
              </ul>
              <p>
                <strong>Assurance responsabilité civile :</strong> conformément à l'article L321-1 du Code du sport,
                Overbound est assurée auprès de {COMPANY_INFO.insurance.insurer} (contrat «{' '}
                {COMPANY_INFO.insurance.product} » n° {COMPANY_INFO.insurance.policyNumber}, valable du{' '}
                {COMPANY_INFO.insurance.validFrom} au {COMPANY_INFO.insurance.validUntil}) pour sa responsabilité
                civile au titre des activités suivantes : {COMPANY_INFO.insurance.coveredActivities}. Plafonds de
                garantie :
              </p>
              <ul>
                {COMPANY_INFO.insurance.limits.map((limit) => (
                  <li key={limit.label}>
                    {limit.label} : {limit.amount}
                  </li>
                ))}
              </ul>
              <p>
                Cette assurance indemnise les victimes des dommages dont Overbound est responsable, dans les limites et
                conditions du contrat. L'attestation d'assurance est communiquée sur simple demande à{' '}
                <Link href={`mailto:${COMPANY_INFO.contact.email}`} className="text-primary hover:underline">
                  {COMPANY_INFO.contact.email}
                </Link>
                .
              </p>
              <p>
                <strong>Ce que cette assurance ne couvre pas :</strong> les dommages corporels que le participant se
                cause à lui-même ou qui surviennent sans faute d'un tiers responsable (par exemple une chute sur un
                obstacle conforme). Ces dommages ne sont indemnisés que par une assurance personnelle.
              </p>
              <p>
                <strong>Assurance individuelle accident :</strong> Overbound informe chaque participant de son intérêt
                à souscrire une assurance individuelle accident couvrant les dommages corporels liés à la pratique
                sportive (frais médicaux, invalidité, décès). Une licence sportive ou une assurance personnelle peut
                déjà inclure cette garantie : il appartient au participant de le vérifier avant l'événement.
              </p>
            </section>

            {/* 13. Litiges */}
            <section id="litiges" className="mb-12">
              <h2 className="text-2xl font-bold">13. Litiges et médiation</h2>
              <p>
                <strong>Réclamation :</strong> Toute réclamation doit être adressée en priorité par email à{' '}
                <Link href={`mailto:${COMPANY_INFO.contact.email}`} className="text-primary hover:underline">
                  {COMPANY_INFO.contact.email}
                </Link>
                . Overbound s'engage à répondre dans un délai de 7 jours ouvrés.
              </p>
              <p>
                <strong>Médiation :</strong> Conformément à l'article L.612-1 du Code de la consommation, tout
                consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la
                résolution amiable d'un litige.
              </p>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="font-semibold">Médiateur de la consommation :</p>
                <p>{COMPANY_INFO.mediation.name}</p>
                <p>{COMPANY_INFO.mediation.address}</p>
                <p>
                  Site web :{' '}
                  <Link
                    href={COMPANY_INFO.mediation.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {COMPANY_INFO.mediation.website.replace('https://', '')}
                  </Link>
                </p>
              </div>
            </section>

            {/* 14. Loi applicable */}
            <section id="loi" className="mb-12">
              <h2 className="text-2xl font-bold">14. Loi applicable</h2>
              <p>
                Les présentes CGV sont régies par le droit français. Tout litige relatif à leur interprétation ou à
                leur exécution relève des juridictions françaises.
              </p>
              <p>
                Pour les consommateurs, conformément à l'article R. 631-3 du Code de la consommation, la juridiction
                compétente est celle du domicile du défendeur ou du lieu d'exécution de la prestation.
              </p>
            </section>

            {/* Footer links */}
            <div className="mt-12 rounded-lg border bg-muted/30 p-6">
              <h3 className="mb-4 font-semibold">Documents complémentaires</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/cgu" className="text-primary hover:underline">
                    Conditions Générales d'Utilisation (CGU)
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policies" className="text-primary hover:underline">
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="text-primary hover:underline">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-primary hover:underline">
                    Politique de cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
