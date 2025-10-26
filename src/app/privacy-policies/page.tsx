import Link from 'next/link'

const lastUpdated = '26/10/2025'

const toc = [
  { id: 'intro', label: '1. Objet de la politique' },
  { id: 'responsable', label: '2. Responsable de traitement & contact' },
  { id: 'donnees-collectees', label: '3. Données collectées' },
  { id: 'finalites', label: '4. Finalités & bases légales' },
  { id: 'destinataires', label: '5. Destinataires & sous-traitants' },
  { id: 'duree', label: '6. Durées de conservation' },
  { id: 'droits', label: '7. Droits des personnes & modalités d’exercice' },
  { id: 'securite', label: '8. Sécurité & confidentialité' },
  { id: 'transferts', label: '9. Transferts hors Union européenne' },
  { id: 'mineurs', label: '10. Situation des mineurs' },
  { id: 'cookies', label: '11. Cookies & technologies similaires' },
  { id: 'decisions', label: '12. Décisions automatisées & profilage' },
  { id: 'partenariats', label: '13. Partenariats & co-responsabilité' },
  { id: 'mise-a-jour', label: '14. Mise à jour de la politique' },
  { id: 'recours', label: '15. Recours & droit de saisir la CNIL' },
]

const paragraphs = {
  intro: [
    "La présente Politique de confidentialité vise à informer les utilisateurs de la plateforme Overbound (ci-après « la Plateforme » ou « Overbound ») des traitements de données à caractère personnel mis en œuvre, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.",
    "Elle complète les Conditions Générales d’Utilisation disponibles à l’adresse https://overbound-race.com/cgu et s’applique à toutes les interactions avec Overbound, qu’elles soient numériques ou lors des événements physiques organisés ou opérés par Overbound.",
  ],
  responsable: [
    'Responsable de traitement : Overbound SASU, société par actions simplifiée unipersonnelle au capital de 5 000 €, dont le siège social est situé 105 Rue de la Brèche du Houx, 78760 Jouars-Pontchartrain, France.',
    'Contact principal : contact@overbound-race.com',
    'Téléphone : +33 (0)6 52 26 60 54',
  ],
  donneesCollectees: [
    'Données d’identification : nom, prénom, date de naissance, nationalité, sexe, photo, identifiant interne.',
    'Coordonnées : adresse postale, adresse email, numéro de téléphone.',
    'Données de compte : identifiant, mots de passe hashés, préférences linguistiques.',
    'Données d’inscription événementielle : format choisi, numéro de dossard, historique des participations, documents requis (certificat médical, attestation parentale).',
    'Données financières : informations de paiement traitées par Stripe (quatre derniers chiffres de la carte, token de paiement), factures et historiques de transaction.',
    'Données techniques : logs de connexion, adresse IP, device, navigateur, zones horodatées, cookies, identifiants publicitaires (avec consentement).',
    'Données de performance : chronométrage, classements, statistiques de course, notes et feedbacks.',
    'Données communautaires : messages envoyés via la Plateforme, participations aux forums, réponses aux enquêtes de satisfaction.',
  ],
  finalites: [
    'Gestion des comptes utilisateurs et authentification – Base légale : exécution du contrat (art. 6(1)(b) RGPD).',
    'Inscription aux événements, gestion des dossards et suivi des obligations réglementaires (certificat médical) – Base légale : exécution du contrat / obligation légale (Code du sport).',
    'Gestion de la billetterie, paiement, facturation – Base légale : exécution du contrat et obligation légale (obligation comptable).',
    'Communication d’informations relatives aux événements, newsletters partenaires, offres commerciales – Base légale : consentement explicite ou intérêt légitime (relation clients).',
    'Analyse statistique et amélioration des services (fréquentation, performances, satisfaction) – Base légale : intérêt légitime.',
    'Lutte contre la fraude, respect des obligations légales, gestion des litiges – Base légale : obligation légale / intérêt légitime.',
    'Production de contenus média et communication (photos/vidéos) – Base légale : intérêt légitime, avec possibilité d’opposition.',
  ],
  destinataires: [
    'Personnel habilité d’Overbound (équipes opérationnelles, support, marketing, finance) soumis à une clause de confidentialité.',
    'Organisateurs partenaires et prestataires logistiques (sécurité, chronométrage, bénévoles) pour les besoins de l’événement.',
    'Sous-traitants techniques : Vercel (hébergement), Supabase (base de données), Stripe (paiement), Mailgun (emails transactionnels), Segment (analyse), Sentry (monitoring), Metabase (BI).',
    'Autorités administratives ou judiciaires lorsqu’une obligation légale l’impose (réquisitions, enquêtes, lutte contre la fraude).',
    "Sponsors et partenaires commerciaux dans le cadre d'opérations marketing, uniquement si l’utilisateur a donné son consentement explicite.",
  ],
  duree: [
    'Compte utilisateur : durée d’activité du compte + 3 ans à compter de la dernière interaction pour relances marketing (intérêt légitime).',
    'Données relatives aux événements (inscriptions, factures) : 10 ans conformément aux obligations comptables et contractuelles.',
    'Documents médicaux ou autorisations parentales : durée de l’événement + 1 an, puis archivage sécurisé ou suppression.',
    'Logs techniques : 12 mois maximum.',
    'Cookies : durée maximale de 13 mois, préférences de consentement conservées 6 mois.',
    'Images et contenus médiatiques : 5 ans, ou suppression anticipée sur demande justifiée.',
  ],
  droits: [
    'Droit d’accès : obtenir confirmation que des données sont traitées, accéder à leur contenu et en recevoir une copie.',
    'Droit de rectification : corriger, compléter ou mettre à jour des données inexactes ou incomplètes.',
    'Droit d’effacement (« droit à l’oubli ») : supprimer des données lorsque leur conservation n’est plus justifiée, dans la limite des obligations légales.',
    'Droit d’opposition : s’opposer à tout moment aux traitements fondés sur l’intérêt légitime (marketing, profilage léger).',
    'Droit à la limitation : geler temporairement une partie des traitements en cas de contestation.',
    'Droit à la portabilité : recevoir les données fournies dans un format structuré, couramment utilisé et lisible par machine.',
    'Droit de retirer son consentement : retirer à tout moment son consentement aux traitements reposant sur celui-ci (newsletters, cookies marketing).',
    'Modalités : envoyer un email à privacy@overbound-race.com ou un courrier à Overbound – DPO, 24 rue du Faubourg Saint-Martin, 75010 Paris. Réponse sous 30 jours.',
  ],
  securite: [
    'Infrastructure hébergée sur Vercel (UE) et Supabase (UE) avec chiffrement des données en transit (TLS 1.2+) et au repos (AES-256).',
    'Contrôles d’accès stricts, gestion des rôles, authentification à facteurs multiples pour les administrateurs.',
    'Journalisation des actions sensibles, systèmes de détection d’intrusion, politiques de sauvegarde quotidienne.',
    'Audit de sécurité annuel et programme de bug bounty privé. Signalement des vulnérabilités à contact@overbound-race.com.',
    'Plan de réponse aux incidents incluant notification à la CNIL dans les 72 heures et information des personnes concernées lorsque le risque est élevé.',
  ],
  transferts: [
    "Certains sous-traitants (Stripe Payments Europe Limited, Vercel Inc., Mailgun Technologies, LLC) sont situés hors de l’UE (États-Unis). Les transferts sont encadrés par des clauses contractuelles types (CCT) approuvées par la Commission européenne et, le cas échéant, des mesures complémentaires (chiffrement, pseudonymisation).",
    'Overbound vérifie régulièrement les certifications et engagements de ses prestataires (Privacy Shield remplacé par le Data Privacy Framework).',
  ],
  mineurs: [
    'L’accès à la Plateforme est possible dès 16 ans. Pour les mineurs de moins de 18 ans souhaitant s’inscrire à un événement payant, une autorisation parentale est exigée.',
    'Les données relatives aux mineurs sont traitées avec une vigilance renforcée : accès restreint, durée de conservation limitée à 3 ans, suppression sur simple demande du représentant légal.',
  ],
  cookies: [
    'Overbound utilise des cookies nécessaires au fonctionnement du site (authentification, maintien de session), ainsi que des cookies de mesure d’audience (Matomo, Google Analytics) et marketing (Facebook Pixel, TikTok Ads) soumis au consentement.',
    'La gestion du consentement est opérée via la plateforme de gestion de consentement (CMP) Didomi : l’utilisateur peut modifier ses préférences à tout moment via le centre de confidentialité accessible en pied de page.',
    'Pour plus de détails, consulter la Politique Cookies : https://overbound-race.com/cookies.',
  ],
  decisions: [
    'Overbound ne recourt pas à des décisions entièrement automatisées produisant des effets juridiques pour les utilisateurs.',
    'Des traitements de profilage peuvent être utilisés pour recommander des événements ou proposer des offres personnalisées. Ils reposent sur l’historique de participation, le niveau déclaré et les préférences sportives. À tout moment, l’utilisateur peut s’y opposer via son espace personnel ou en écrivant à privacy@overbound-race.com.',
  ],
  partenariats: [
    "Certaines courses peuvent être co-organisées avec des partenaires locaux (clubs sportifs, salles). Dans ce cadre, un accord de co-responsabilité est mis en place pour définir précisément les responsabilités respectives vis-à-vis des traitements de données. Les informations clés sont communiquées dans le règlement de chaque événement.",
  ],
  miseAJour: [
    "Overbound peut modifier la présente Politique pour tenir compte des évolutions réglementaires ou fonctionnelles. Toute modification substantielle est notifiée par email ou via une bannière d’information au moins 15 jours avant son entrée en vigueur.",
    "La Politique mise à jour est consultable en permanence sur https://overbound-race.com/privacy-policies. La date de dernière mise à jour figure en en-tête de page.",
  ],
  recours: [
    "En cas de difficulté non résolue, l’utilisateur dispose du droit d’introduire une réclamation auprès de la Commission Nationale de l’Informatique et des Libertés (CNIL) – 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 – www.cnil.fr.",
    "Les utilisateurs résidant dans un autre pays de l’Union européenne peuvent saisir l’autorité de contrôle compétente de leur lieu de résidence.",
  ],
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-gradient-to-b from-background via-muted/60 to-background py-20">
        <div className="container mx-auto max-w-5xl px-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Politique de confidentialité</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight lg:text-5xl">Protection des données personnelles Overbound</h1>
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
            Découvrez comment Overbound collecte, utilise et protège vos données lors de votre utilisation de la plateforme et de votre participation
            à nos événements sportifs. Nous détaillons nos engagements, vos droits et nos points de contact dédiés.
          </p>
          <p className="mt-4 text-sm text-muted-foreground/80">Dernière mise à jour : {lastUpdated}</p>
        </div>
      </section>

      <section className="border-t border-border bg-background py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground shadow-lg shadow-primary/10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sommaire</h2>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Naviguez facilement dans la politique grâce à ces ancres. Vous pouvez revenir en haut via « Retour haut de page » à la fin de chaque section.
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
              Pour toute question, écrivez à{' '}
              <Link href="mailto:privacy@overbound-race.com" className="text-primary hover:underline">
                privacy@overbound-race.com
              </Link>{' '}
              ou contactez notre DPO.
            </div>
          </div>

          <article className="mt-12 space-y-12">
            <Section id="intro" title={toc[0].label} paragraphs={paragraphs.intro} />
            <Section id="responsable" title={toc[1].label} bulletList={paragraphs.responsable} />
            <Section id="donnees-collectees" title={toc[2].label} bulletList={paragraphs.donneesCollectees} />
            <Section id="finalites" title={toc[3].label} bulletList={paragraphs.finalites} />
            <Section id="destinataires" title={toc[4].label} bulletList={paragraphs.destinataires} />
            <Section id="duree" title={toc[5].label} bulletList={paragraphs.duree} />
            <Section id="droits" title={toc[6].label} bulletList={paragraphs.droits} />
            <Section id="securite" title={toc[7].label} bulletList={paragraphs.securite} />
            <Section id="transferts" title={toc[8].label} bulletList={paragraphs.transferts} />
            <Section id="mineurs" title={toc[9].label} bulletList={paragraphs.mineurs} />
            <Section id="cookies" title={toc[10].label} bulletList={paragraphs.cookies} />
            <Section id="decisions" title={toc[11].label} bulletList={paragraphs.decisions} />
            <Section id="partenariats" title={toc[12].label} bulletList={paragraphs.partenariats} />
            <Section id="mise-a-jour" title={toc[13].label} paragraphs={paragraphs.miseAJour} />
            <Section id="recours" title={toc[14].label} paragraphs={paragraphs.recours} />
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

function Section({ id, title, paragraphs: list, bulletList }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-32 space-y-4 rounded-3xl border border-border bg-card/80 p-8 shadow-lg shadow-primary/10">
      <h3 className="text-xl font-semibold">{title}</h3>
      {list
        ? list.map((content, index) => (
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
