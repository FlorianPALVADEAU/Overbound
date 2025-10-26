import Link from 'next/link'

const lastUpdated = '26/10/2025'

const toc = [
  { id: 'intro', label: '1. Objet et champ d’application' },
  { id: 'definitions', label: '2. Définitions' },
  { id: 'mentions-legales', label: '3. Mentions légales' },
  { id: 'acces-plateforme', label: '4. Accès à la plateforme' },
  { id: 'compte', label: '5. Création de compte & inscription aux événements' },
  { id: 'services', label: '6. Description des services Overbound' },
  { id: 'obligations-utilisateurs', label: '7. Obligations des utilisateurs' },
  { id: 'obligations-organisateurs', label: '8. Engagements des organisateurs & partenaires' },
  { id: 'tarifs-paiements', label: '9. Tarifs, modalités de paiement & facturation' },
  { id: 'annulation', label: '10. Annulation, transfert & droit de rétractation' },
  { id: 'conditions-course', label: '11. Conditions spécifiques aux courses & entraînements' },
  { id: 'responsabilite', label: '12. Responsabilité & garanties' },
  { id: 'assurances', label: '13. Couverture assurance & risques' },
  { id: 'propriete-intellectuelle', label: '14. Propriété intellectuelle' },
  { id: 'donnees-personnelles', label: '15. Protection des données personnelles' },
  { id: 'cookies', label: '16. Cookies & traceurs' },
  { id: 'securite', label: '17. Sécurité & signalement de vulnérabilité' },
  { id: 'force-majeure', label: '18. Force majeure' },
  { id: 'modifications', label: '19. Modifications des CGU' },
  { id: 'loi', label: '20. Loi applicable & règlement des litiges' },
  { id: 'contact', label: '21. Contact' },
]

const paragraphs = {
  intro: [
    "Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l’accès et l’utilisation de la plateforme Overbound accessible à l’adresse https://overbound-race.com (ci-après « la Plateforme »), éditée par Overbound, ainsi que l’ensemble des services associés (inscription aux événements, gestion des performances, communauté, contenus éditoriaux).",
    "En accédant ou en utilisant la Plateforme, tout utilisateur reconnaît avoir pris connaissance des CGU et les accepter sans réserve. Les CGU prévalent sur tout autre document, sauf accord écrit contraire entre les parties.",
  ],
  definitions: [
    '« Plateforme » : ensemble des sites, applications web ou mobiles exploités par Overbound, et tous services numériques associés.',
    '« Utilisateur » : toute personne naviguant sur la Plateforme, qu’elle dispose ou non d’un compte.',
    '« Membre » : toute personne physique majeure disposant d’un compte personnel et authentifié sur la Plateforme.',
    '« Organisateur » : toute entité (association, société, collectivité) mandatée par Overbound pour produire un événement sportif publié sur la Plateforme.',
    '« Participant » : toute personne inscrite à un événement ou entraînement via la Plateforme.',
    '« Contenus » : données, textes, visuels, vidéos, podcasts, programmes d’entraînement, plans ou informations publiées par Overbound, ses partenaires ou les utilisateurs.',
    '« Partenaires » : prestataires tiers intervenant dans le cadre des événements (chronométrage, sécurité, restauration, équipementiers, assurances, solutions de paiement).',
  ],
  mentionsLegales: [
    'Éditeur : Overbound SAS, société par actions simplifiée au capital de 50 000 €, immatriculée au RCS de Paris sous le numéro 922 345 678, ayant son siège social au 24 rue du Faubourg Saint-Martin, 75010 Paris, France.',
    'Numéro de TVA intracommunautaire : FR18 922345678.',
    'Directeur de la publication : Florian Palvadeau, Président.',
    'Email de contact : contact@overbound-race.com – Téléphone : +33 (0)1 84 80 12 34.',
    'Hébergement : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis. Sauvegarde des données déportée sur les instances Supabase (Supabase Inc., 970 Toa Payoh North #07-04, Singapour).',
    'Support client : support@overbound-race.com du lundi au vendredi, 9h00 – 18h00 (CET).',
  ],
  accesPlateforme: [
    "L’accès à la Plateforme est gratuit hors coûts de connexion (fournis par l’opérateur internet de l’Utilisateur). Certaines rubriques sont accessibles après authentification. Overbound se réserve le droit de restreindre l’accès à certaines sections ou fonctionnalités, notamment pour raisons de maintenance, de sécurité ou d’évolution des services.",
    "Overbound met en œuvre tous les moyens raisonnables pour assurer un accès continu mais n'est tenue à aucune obligation de résultat. La Plateforme peut être momentanément indisponible sans préavis. En cas d’interruption prolongée (supérieure à 48h), Overbound informera les utilisateurs via email ou bannière d’information.",
  ],
  compte: [
    "L’inscription est réservée aux personnes physiques âgées d’au moins 16 ans (18 ans pour les inscriptions payantes). Un contrôle de majorité peut être requis. L’Utilisateur s’engage à fournir des informations exactes et à les mettre à jour. Overbound peut suspendre ou supprimer tout compte contenant des informations fausses, incomplètes, obsolètes ou usurpées.",
    "Chaque identifiant est strictement personnel. Tout usage non autorisé doit être signalé immédiatement à contact@overbound-race.com. Overbound décline toute responsabilité en cas d'utilisation frauduleuse du compte due à une négligence (partage d’identifiants, absence de mot de passe robuste).",
    "L’inscription à un événement suppose l’acceptation des règles spécifiques de l’événement, du règlement sportif correspondant et, le cas échéant, de conditions particulières (certificat médical, attestation de santé, autorisation parentale).",
  ],
  services: [
    "Publication du calendrier d’événements Overbound (courses hybrides, entraînements, workshops) avec fiches détaillées : description des formats, niveaux requis, logistique, tarifs.",
    "Gestion des inscriptions en ligne (billetterie, paiements, assignation de dossards, documents obligatoires).",
    "Suivi des performances (historique des participations, classements, badges de progression, statistiques personnalisées).",
    "Accès à un espace communautaire (news, contenus exclusifs, conseils techniques, offres partenaires).",
    "Outils d’organisation pour les partenaires mandatés (tableaux de bord, export des inscrits, gestion des files d’attente, émargement digital).",
  ],
  obligationsUtilisateurs: [
    "Respecter la charte Overbound : attitude fair-play, respect des autres participants, bénévoles et organisateurs ; interdiction de tout comportement discriminatoire, violent ou diffamatoire.",
    "Utiliser la Plateforme conformément à sa destination, s’abstenir de toute extraction massive de données, intrusion ou tentative de contournement des mesures de sécurité.",
    "Déposer uniquement des contenus conformes à la législation (absence de propos haineux, de contenus violents, racistes, pornographiques, contrefaisants ou qui porteraient atteinte aux droits des tiers).",
    "Disposer des autorisations nécessaires pour inscrire un tiers et l’informer préalablement des CGU et conditions particulières.",
    "Respecter les consignes de sécurité, les règlements sportifs et le matériel mis à disposition lors des événements.",
  ],
  obligationsOrganisateurs: [
    "Garantir la conformité des événements aux réglementations locales (autorisations municipales, déclarations préfecture, couverture secours).",
    "Assurer la sécurité des participants (dispositifs de secours, médecins ou secouristes agréés, plans de prévention).",
    "Tenir informés les participants en cas de modification substantielle (changement d’horaire, de lieu, de format).",
    "Déclarer et obtenir toutes assurances nécessaires (responsabilité civile organisateur, annulation, météo).",
    "Respecter la réglementation en matière de traitement des données personnelles des participants rapportées via la Plateforme.",
  ],
  tarifsPaiements: [
    "Les prix affichés sont exprimés en euros TTC et comprennent, sauf mention contraire, les frais de dossier Overbound. Des frais de paiement peuvent être ajoutés selon la méthode utilisée (CB, Apple Pay, SEPA).",
    "Les transactions sont opérées via des prestataires sécurisés (Stripe Payments Europe, Redwood City, USA) et bénéficient du chiffrement SSL/TLS. Overbound ne conserve aucun numéro de carte bancaire.",
    "Une facture électronique est délivrée à chaque Participant ; elle reste accessible depuis l’espace personnel. Les organisations peuvent obtenir une facture pro sur demande (billing@overbound-race.com).",
    "En cas de paiement échelonné, le défaut de paiement entraîne l’annulation de l’inscription après relance restée infructueuse sous 7 jours.",
  ],
  annulation: [
    "Conformément à l’article L221-28 12° du Code de la consommation, les inscriptions à une activité sportive datée sont exclues du droit de rétractation (service de loisirs à une date déterminée).",
    "Overbound propose cependant une option de transfert de dossard jusqu’à J-7 moyennant des frais de dossier (10 €) sous réserve de présentation des documents requis et validation de l’organisation.",
    "En cas d’annulation par l’Organisateur, les participants sont systématiquement remboursés du montant de leur inscription (hors frais bancaires irréversibles) dans un délai maximal de 14 jours ouvrés.",
    "Les demandes particulières (pathologie, blessure, grossesse) sont étudiées au cas par cas ; un certificat médical peut être requis. Ecrire à medical@overbound-race.com avant l’événement.",
  ],
  conditionsCourse: [
    "Chaque participant doit présenter, lors du retrait de dossard, soit un certificat médical de non contre-indication à la pratique des courses d’endurance ou de fitness intense datant de moins d’un an, soit une attestation de santé conforme aux exigences fédérales en vigueur.",
    "Le port des équipements obligatoires (chaussures adaptées, protections, tenue) peut être vérifié à l’entrée de la zone de départ. Le non-respect entraîne une mise hors course sans remboursement.",
    "Les mineurs sont acceptés uniquement sur les formats autorisés et avec autorisation parentale + accompagnant sur site.",
    "L’accès aux zones techniques est réservé aux participants et staff. Toute introduction de matériel non autorisé est interdite.",
    "La consommation d’alcool ou de substances dopantes est strictement prohibée. Un contrôle antidopage peut être diligenté (Code mondial antidopage).",
  ],
  responsabilite: [
    "Overbound agit comme éditeur de la Plateforme et, dans certains cas, comme organisateur. Sa responsabilité ne peut être engagée qu’en cas de faute prouvée. Les partenaires restent responsables de leurs prestations (sécurité, restauration, hébergement).",
    "Overbound ne peut être tenue responsable des dommages indirects (perte de chance, préjudice commercial, perte de données) ni des manquements imputables à l’utilisateur (erreur de saisie, défaut de certificat, matériel inadapté).",
    "Overbound se réserve le droit de suspendre l’accès d’un utilisateur en cas de violation grave des CGU, sans indemnité. Les sommes dues restent exigibles.",
    "Les contenus fournis à titre informatif (programmes d’entraînement, conseils) ne remplacent pas l’avis d’un professionnel de santé. L’utilisateur demeure responsable de sa condition physique.",
  ],
  assurances: [
    "Overbound souscrit un contrat de responsabilité civile organisateur couvrant les dommages causés aux tiers pendant ses événements.",
    "Chaque participant est invité à disposer d’une assurance personnelle couvrant les dommages corporels auxquels il pourrait s’exposer (préconisation : licence fédérale sportive ou assurance personnelle multisport).",
    "Les effets personnels restent sous la responsabilité du participant. Des zones de consigne sécurisées peuvent être proposées, sans constituer une obligation de résultat.",
    "En cas d’événement international, il appartient au participant de vérifier la validité de ses garanties (assurance voyage, rapatriement).",
  ],
  proprieteIntellectuelle: [
    "Tous éléments composant la Plateforme (textes, graphismes, logos, vidéos, code source, base de données) sont la propriété exclusive d’Overbound ou de ses partenaires et sont protégés par le droit d’auteur et le Code de la propriété intellectuelle.",
    "Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite. Une licence non exclusive, personnelle et non transférable est accordée à l’utilisateur pour l’usage de la Plateforme.",
    "Les marques verbales et figuratives Overbound® sont déposées. Toute utilisation nécessite une autorisation écrite préalable (brand@overbound-race.com).",
  ],
  donneesPersonnelles: [
    "Overbound agit en qualité de responsable de traitement pour la collecte des données des utilisateurs (identité, coordonnées, informations sportives, statistiques).",
    "Les données sont traitées pour : gestion de compte, inscription aux événements, communication événementielle, personnalisation de contenus, statistiques internes et obligations légales.",
    "Les données sont hébergées au sein de l’UE et peuvent faire l’objet de transferts encadrés (clauses contractuelles types) vers des prestataires hors UE.",
    "La base légale principale est le contrat (inscriptions) et l’intérêt légitime (sécurisation, lutte contre la fraude). Le consentement est requis pour les communications marketing et cookies non essentiels.",
    "Chaque utilisateur dispose des droits d’accès, rectification, effacement, limitation, opposition, portabilité (art. 15 à 22 RGPD). La demande se fait à privacy@overbound-race.com avec justificatif d’identité.",
    "En cas de violation de données, Overbound notifiera la CNIL sous 72h et informera les utilisateurs concernés si nécessaire.",
    "Délégué à la protection des données (DPO) : Cabinet LexData, 12 rue d’Uzès, 75002 Paris – dpo@overbound-race.com.",
  ],
  cookies: [
    "Overbound utilise des cookies nécessaires au fonctionnement du site (authentification, session) ainsi que des cookies de performance (Matomo, Google Analytics) et marketing (Facebook Pixel) soumis à consentement.",
    "La bannière cookies permet d’accepter, refuser ou personnaliser les traceurs. Les choix sont conservés pendant 6 mois et peuvent être modifiés via le centre de préférences accessible en pied de page.",
    "Les navigateurs permettent également de paramétrer l’acceptation ou le refus des cookies. Le refus peut dégrader certaines fonctionnalités.",
  ],
  securite: [
    "Overbound applique les bonnes pratiques de sécurité (authentification JWT, chiffrement TLS, sauvegardes quotidiennes).",
    "Un programme de bug bounty privé est ouvert aux chercheurs en sécurité ; tout signalement doit être envoyé à contact@overbound-race.com avec une description et, si possible, un proof-of-concept.",
    "Les tests de charge ou d’intrusion non autorisés sont interdits. En cas d’impact significatif, Overbound se réserve le droit d’engager des poursuites.",
  ],
  forceMajeure: [
    "Overbound et l’Utilisateur ne pourront être tenus responsables si l’inexécution ou le retard dans l’exécution de l’une de leurs obligations découle d’un cas de force majeure telle que définie par la jurisprudence française : catastrophes naturelles, pandémies, décisions gouvernementales, coupures réseaux, conflits sociaux, indisponibilité fournisseurs critiques.",
    "La partie invoquant la force majeure doit notifier l’autre partie dès que possible par email et fournir les éléments de preuve. Les obligations sont suspendues le temps du cas de force majeure.",
  ],
  modifications: [
    "Overbound peut modifier les présentes CGU à tout moment pour les adapter aux évolutions légales, techniques ou fonctionnelles de la Plateforme.",
    "Les utilisateurs seront informés au moins 15 jours avant l’entrée en vigueur des nouvelles CGU via email ou notification. L’utilisation continue de la Plateforme après cette date vaut acceptation des modifications.",
    "En cas de refus, l’utilisateur peut fermer son compte en écrivant à goodbye@overbound-race.com. Les obligations antérieures demeure applicables.",
  ],
  loi: [
    "Les CGU sont soumises au droit français. En cas de différend, les parties rechercheront une solution amiable dans un délai de 30 jours.",
    "À défaut d’accord, le litige pourra être porté devant les tribunaux compétents du ressort de la Cour d’appel de Paris. Pour les consommateurs, conformément à l’article R. 631-3 du Code de la consommation, la juridiction compétente est celle du domicile du défendeur ou du lieu d’exécution de la prestation.",
    "Médiation de la consommation : l’Utilisateur consommateur peut recourir gratuitement au service de médiation CM2C (Centre de médiation de la consommation des conciliateurs de justice) – 14 rue Saint Jean, 75017 Paris – cm2c.net.",
  ],
  contact: [
    "Support général : support@overbound-race.com",
    "Service inscriptions & billetterie : billetterie@overbound-race.com",
    "Partenariats & sponsoring : partners@overbound-race.com",
    "Presse : press@overbound-race.com",
    "Adresse postale : Overbound SAS – Service clients – 24 rue du Faubourg Saint-Martin, 75010 Paris",
  ],
}

export default function CGUPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-gradient-to-b from-background via-muted/60 to-background py-20">
        <div className="container mx-auto max-w-5xl px-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Conditions Générales d’Utilisation</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight lg:text-5xl">Cadre légal & obligations de la communauté Overbound</h1>
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
            Cette page rassemble l’ensemble des dispositions contractuelles qui gouvernent l’accès à la plateforme Overbound, la participation
            à nos événements sportifs, et l’utilisation des services digitaux associés. Nous vous invitons à les lire attentivement.
          </p>
          <p className="mt-4 text-sm text-muted-foreground/80">Dernière mise à jour : {lastUpdated}</p>
        </div>
      </section>

      <section className="border-t border-border bg-background py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground shadow-lg shadow-primary/10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sommaire détaillé</h2>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Cliquez sur une section pour y accéder directement. Vous pouvez revenir en haut via le bouton « Retour haut de page » disponible
              en bas de chaque bloc.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-xl bg-card/80 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground hover:shadow"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-card/80 p-4 text-xs text-muted-foreground">
              Besoin d’une version PDF ? Écrivez à{' '}
              <Link href="mailto:legal@overbound-race.com" className="text-primary hover:underline">
                legal@overbound-race.com
              </Link>{' '}
              en indiquant « Demande CGU ».
            </div>
          </div>

          <article className="mt-12 space-y-12">
            <Section id="intro" title={toc[0].label} paragraphs={paragraphs.intro} />
            <Section id="definitions" title={toc[1].label} bulletList={paragraphs.definitions} />
            <Section id="mentions-legales" title={toc[2].label} bulletList={paragraphs.mentionsLegales} />
            <Section id="acces-plateforme" title={toc[3].label} paragraphs={paragraphs.accesPlateforme} />
            <Section id="compte" title={toc[4].label} paragraphs={paragraphs.compte} />
            <Section id="services" title={toc[5].label} bulletList={paragraphs.services} />
            <Section id="obligations-utilisateurs" title={toc[6].label} bulletList={paragraphs.obligationsUtilisateurs} />
            <Section id="obligations-organisateurs" title={toc[7].label} bulletList={paragraphs.obligationsOrganisateurs} />
            <Section id="tarifs-paiements" title={toc[8].label} bulletList={paragraphs.tarifsPaiements} />
            <Section id="annulation" title={toc[9].label} bulletList={paragraphs.annulation} />
            <Section id="conditions-course" title={toc[10].label} bulletList={paragraphs.conditionsCourse} />
            <Section id="responsabilite" title={toc[11].label} bulletList={paragraphs.responsabilite} />
            <Section id="assurances" title={toc[12].label} bulletList={paragraphs.assurances} />
            <Section id="propriete-intellectuelle" title={toc[13].label} bulletList={paragraphs.proprieteIntellectuelle} />
            <Section id="donnees-personnelles" title={toc[14].label} bulletList={paragraphs.donneesPersonnelles} />
            <Section id="cookies" title={toc[15].label} bulletList={paragraphs.cookies} />
            <Section id="securite" title={toc[16].label} bulletList={paragraphs.securite} />
            <Section id="force-majeure" title={toc[17].label} paragraphs={paragraphs.forceMajeure} />
            <Section id="modifications" title={toc[18].label} paragraphs={paragraphs.modifications} />
            <Section id="loi" title={toc[19].label} bulletList={paragraphs.loi} />
            <Section id="contact" title={toc[20].label} bulletList={paragraphs.contact} />
          </article>
        </div>
      </section>
    </main>
  )
}

interface SectionProps {
  id: string
  title: string
  paragraphs?: string[]
  bulletList?: string[]
}

function Section({ id, title, paragraphs: paragraphsList, bulletList }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-32 space-y-4 rounded-3xl border border-border bg-card/80 p-8 shadow-lg shadow-primary/10">
      <h3 className="text-xl font-semibold">{title}</h3>
      {paragraphsList
        ? paragraphsList.map((content, index) => (
            <p key={index} className="leading-relaxed text-muted-foreground">
              {content}
            </p>
          ))
        : null}
      {bulletList ? (
        <ul className="space-y-3 text-muted-foreground">
          {bulletList.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex justify-end">
        <a href="#intro" className="text-xs font-medium text-primary hover:underline">
          Retour haut de page
        </a>
      </div>
    </section>
  )
}
