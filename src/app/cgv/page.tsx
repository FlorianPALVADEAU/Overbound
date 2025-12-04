import type { Metadata } from 'next';
import Link from 'next/link'
import { COMPANY_INFO } from '@/constants/companyInfo'

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

const lastUpdated = '27/11/2024'

const toc = [
  { id: 'intro', label: '1. Objet et acceptation' },
  { id: 'mentions-legales', label: '2. Identification du vendeur' },
  { id: 'services', label: '3. Services proposés' },
  { id: 'inscription', label: '4. Modalités d\'inscription' },
  { id: 'tarifs', label: '5. Tarifs et frais' },
  { id: 'paiement', label: '6. Modalités de paiement' },
  { id: 'retractation', label: '7. Droit de rétractation' },
  { id: 'transfert', label: '8. Transfert de dossard' },
  { id: 'annulation-organisateur', label: '9. Annulation par l\'organisateur' },
  { id: 'annulation-participant', label: '10. Annulation par le participant' },
  { id: 'conditions-participation', label: '11. Conditions de participation' },
  { id: 'responsabilite', label: '12. Responsabilité' },
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
            Dernière mise à jour : <time dateTime="2024-11-27">{lastUpdated}</time>
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
                des présentes CGV et les accepter sans réserve.
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
                  <strong>Vendeur :</strong> {COMPANY_INFO.legalName}
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
                <strong>Conditions d'âge :</strong> L'inscription aux événements payants est réservée aux personnes
                majeures (18 ans et plus). Les mineurs peuvent participer aux formats autorisés avec autorisation
                parentale et présence d'un accompagnant sur site.
              </p>
              <p>
                <strong>Création de compte :</strong> L'inscription nécessite la création d'un compte personnel avec
                des informations exactes et à jour. L'acheteur s'engage à fournir des informations véridiques.
              </p>
              <p>
                <strong>Documents requis :</strong> Selon l'événement, des documents peuvent être exigés (certificat
                médical, attestation de santé, autorisation parentale, licence sportive). Ces documents doivent être
                présentés lors du retrait du dossard.
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
                paiement choisi (carte bancaire, Apple Pay, virement SEPA).
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
                <li>Apple Pay</li>
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
              <h2 className="text-2xl font-bold">8. Transfert de dossard</h2>
              <p>
                Bien que le droit de rétractation ne s'applique pas, Overbound propose une option de transfert de
                dossard sous certaines conditions :
              </p>
              <ul>
                <li>
                  <strong>Délai :</strong> Le transfert doit être demandé au plus tard 7 jours avant l'événement (J-7)
                </li>
                <li>
                  <strong>Conditions :</strong> Le bénéficiaire doit remplir les conditions de participation et
                  fournir les documents requis
                </li>
                <li>
                  <strong>Validation :</strong> Le transfert est soumis à validation par l'organisation
                </li>
              </ul>
              <p>
                Pour toute demande de transfert, contactez{' '}
                <Link href={`mailto:${COMPANY_INFO.emails.support}`} className="text-primary hover:underline">
                  {COMPANY_INFO.emails.support}
                </Link>
                .
              </p>
            </section>

            {/* 9. Annulation organisateur */}
            <section id="annulation-organisateur" className="mb-12">
              <h2 className="text-2xl font-bold">9. Annulation par l'organisateur</h2>
              <p>
                En cas d'annulation de l'événement par l'organisateur (pour quelque raison que ce soit, y compris force
                majeure), les participants sont intégralement remboursés du montant de leur inscription.
              </p>
              <p>
                <strong>Modalités de remboursement :</strong>
              </p>
              <ul>
                <li>Remboursement du prix du billet (hors frais bancaires irréversibles)</li>
                <li>Délai de remboursement : 14 jours ouvrés maximum</li>
                <li>Mode de remboursement : sur le moyen de paiement utilisé lors de l'achat</li>
              </ul>
              <p>
                Les participants seront informés par email en cas d'annulation et recevront les instructions de
                remboursement.
              </p>
            </section>

            {/* 10. Annulation participant */}
            <section id="annulation-participant" className="mb-12">
              <h2 className="text-2xl font-bold">10. Annulation par le participant</h2>
              <p>
                <strong>Principe :</strong> Les inscriptions ne sont pas remboursables, conformément à l'exclusion du
                droit de rétractation (article L221-28 12° du Code de la consommation).
              </p>
              <p>
                <strong>Cas particuliers :</strong> Les demandes d'annulation pour raisons médicales (blessure,
                maladie, grossesse) sont étudiées au cas par cas.
              </p>
              <ul>
                <li>Un certificat médical peut être requis</li>
                <li>
                  Les demandes doivent être envoyées avant l'événement à{' '}
                  <Link href={`mailto:${COMPANY_INFO.emails.medical}`} className="text-primary hover:underline">
                    {COMPANY_INFO.emails.medical}
                  </Link>
                </li>
                <li>Le remboursement n'est pas automatique et reste à la discrétion d'Overbound</li>
              </ul>
            </section>

            {/* 11. Conditions participation */}
            <section id="conditions-participation" className="mb-12">
              <h2 className="text-2xl font-bold">11. Conditions de participation</h2>
              <p>
                <strong>Certificat médical :</strong> Chaque participant doit présenter lors du retrait du dossard :
              </p>
              <ul>
                <li>
                  Un certificat médical de non contre-indication à la pratique des courses d'endurance ou de fitness
                  intense, datant de moins d'un an
                </li>
                <li>OU une attestation de santé conforme aux exigences fédérales en vigueur</li>
              </ul>
              <p>
                <strong>Équipements obligatoires :</strong> Le port d'équipements adaptés (chaussures de trail ou
                running, protections) peut être vérifié. Le non-respect entraîne une mise hors course sans
                remboursement.
              </p>
              <p>
                <strong>Mineurs :</strong> Les mineurs sont acceptés uniquement sur les formats autorisés avec
                autorisation parentale écrite et présence d'un accompagnant majeur sur site.
              </p>
              <p>
                <strong>Règlement sportif :</strong> Chaque participant s'engage à respecter le règlement sportif de
                l'événement, les consignes de sécurité et les instructions des organisateurs.
              </p>
            </section>

            {/* 12. Responsabilité */}
            <section id="responsabilite" className="mb-12">
              <h2 className="text-2xl font-bold">12. Responsabilité</h2>
              <p>
                <strong>Responsabilité d'Overbound :</strong> Overbound ne peut être tenue responsable que pour les
                fautes prouvées qui lui sont directement imputables. Sa responsabilité est limitée au montant de
                l'inscription.
              </p>
              <p>
                <strong>Exclusions :</strong> Overbound ne peut être tenue responsable :
              </p>
              <ul>
                <li>Des dommages indirects (perte de chance, préjudice commercial, frais de déplacement)</li>
                <li>Toute blessure ni dommage corporel qui ne résulterait pas d'une erreur de la part d'Overbound, incluant un défaut de conception d'un obstacle</li>
                <li>Des erreurs de saisie commises par l'acheteur</li>
                <li>De l'absence de présentation des documents requis</li>
                <li>Des prestations fournies par des partenaires tiers</li>
                <li>Des dommages résultant d'un cas de force majeure</li>
              </ul>
              <p>
                <strong>Assurance :</strong> Chaque participant est vivement invité à souscrire une assurance
                personnelle couvrant les dommages corporels liés à la pratique sportive.
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
