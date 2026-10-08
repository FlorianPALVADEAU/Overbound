export type PodKey = 'consignes' | 'accueil' | 'obstacles' | 'arrivee' | 'ravito' | 'sponsors'

// Un pod est le type de poste que choisit un bénévole. Il se traduit ensuite en une ou
// plusieurs zones du terrain (ex. « Obstacles » → zones A à D).
export class Pod {
  constructor(
    readonly key: PodKey,
    // Libellé envoyé tel quel à l’API (champ `mission`, stocké dans `preferred_mission`) :
    // la répartition retrouve le pod depuis ce texte. Ne pas le renommer sans migrer les données.
    readonly title: string,
    readonly description?: string,
  ) {}
}

export class PodCatalog {
  private constructor(
    private readonly pods: readonly Pod[],
    private readonly legacyTitles: Readonly<Record<string, PodKey>>,
  ) {}

  static standard(): PodCatalog {
    return new PodCatalog(
      [
        new Pod('accueil', 'Accueil', 'Accueil des participants et remise des dossards.'),
        new Pod(
          'obstacles',
          'Obstacles',
          'Encourager, sécuriser et aider les coureurs sur un module. Réparti entre les zones A à D.',
        ),
        new Pod('arrivee', 'Ligne d’arrivée', 'Accueil des coureurs à l’arrivée.'),
        new Pod('ravito', 'Ravito', 'Ravitaillement des coureurs.'),
        new Pod('sponsors', 'Sponsors & logistique', 'Installation, matériel et stands partenaires.'),
        new Pod(
          'consignes',
          'Consignes',
          'Responsable de la gestion et de la sécurité des affaires personnelles des participants.',
        ),
      ],
      // Libellés des candidatures reçues avant la refonte des postes.
      { 'Tribu obstacles': 'obstacles', 'Ravitaillement & récupération': 'ravito', 'Ravito village': 'ravito' },
    )
  }

  all(): readonly Pod[] {
    return this.pods
  }

  findByTitle(title: string): Pod | undefined {
    return this.pods.find((pod) => pod.title === title)
  }

  // null = « je laisse l’équipe décider » ou libellé ancien non attribuable : à placer par l’admin.
  keyFromMission(mission: string): PodKey | null {
    return this.findByTitle(mission)?.key ?? this.legacyTitles[mission] ?? null
  }
}

export const DEFAULT_MISSION = 'Je laisse l’équipe décider'

export const podCatalog = PodCatalog.standard()
