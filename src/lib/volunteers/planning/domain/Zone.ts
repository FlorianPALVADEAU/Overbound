import type { PodKey } from '../../shared/Pod'

export class Zone {
  constructor(
    readonly key: string,
    readonly podKey: PodKey,
    readonly label: string,
    // Poids pour répartir un pod sur plusieurs zones : à effectif égal, la zone au poids le plus
    // élevé reçoit plus de monde.
    readonly defaultWeight: number = 1,
  ) {}
}

export class ZoneCatalog {
  private constructor(private readonly zones: readonly Zone[]) {}

  // L’ordre est celui des colonnes du planning exporté.
  static standard(): ZoneCatalog {
    return new ZoneCatalog([
      new Zone('consignes', 'consignes', 'Consignes'),
      new Zone('accueil', 'accueil', 'Accueil'),
      new Zone('obstacles_a', 'obstacles', 'Obstacles zone A'),
      new Zone('obstacles_b', 'obstacles', 'Obstacles zone B'),
      // Les zones C et D sont les plus importantes : elles reçoivent deux fois plus de monde.
      new Zone('obstacles_c', 'obstacles', 'Obstacles zone C', 2),
      new Zone('obstacles_d', 'obstacles', 'Obstacles zone D', 2),
      new Zone('arrivee', 'arrivee', 'Ligne d’arrivée'),
      new Zone('ravito', 'ravito', 'Ravito'),
      new Zone('sponsors', 'sponsors', 'Sponsors & Logistique'),
    ])
  }

  all(): readonly Zone[] {
    return this.zones
  }

  find(key: string): Zone | undefined {
    return this.zones.find((zone) => zone.key === key)
  }

  has(key: string): boolean {
    return this.find(key) !== undefined
  }

  forPod(podKey: PodKey): Zone[] {
    return this.zones.filter((zone) => zone.podKey === podKey)
  }
}

export const zoneCatalog = ZoneCatalog.standard()
