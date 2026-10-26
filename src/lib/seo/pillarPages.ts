import { BRAND, FORMAT_FACTS, PILLAR_LINKS, PREVIOUS_EDITION, type PageLink } from './siteFacts'
import { FALLBACK_NEXT_EDITION, type NextEditionFacts } from './nextEdition'

export interface PillarFact {
  label: string
  value: string
}

export interface PillarSection {
  heading: string
  paragraphs: string[]
}

export interface PillarFaq {
  question: string
  answer: string
}

export interface PillarContent {
  path: string
  title: string
  description: string
  eyebrow: string
  heading: string
  /** Answer-first paragraph, 40 to 60 words, meant to be quoted as is. */
  answer: string
  facts: PillarFact[]
  sections: PillarSection[]
  faq: PillarFaq[]
  related: PageLink[]
  /** Show the teaser video (and its VideoObject) on this page. */
  video?: boolean
}

const commonFacts = (next: NextEditionFacts): PillarFact[] => [
  { label: 'Format', value: `Boucle de ${FORMAT_FACTS.loopKm} km, 10+ obstacles, tours répétés` },
  { label: 'Deux modes', value: 'OPEN (sans classement) et RANKED (élimination)' },
  { label: 'Âge minimum', value: `${FORMAT_FACTS.minAge} ans` },
  { label: 'Dernière édition', value: `${PREVIOUS_EDITION.dateLabel}, ${PREVIOUS_EDITION.venue}` },
  { label: 'Participants', value: PREVIOUS_EDITION.participants },
  { label: 'Prochaine édition', value: next.confirmed ? `${next.window}${next.venue ? `, ${next.venue}` : ''}` : `${next.window} (date et lieu à confirmer)` },
]

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

export type PillarKey = 'paris' | 'loops' | 'facts'

export const buildPillarPages = (next: NextEditionFacts = FALLBACK_NEXT_EDITION): Record<PillarKey, PillarContent> => ({
  paris: {
    path: PILLAR_LINKS.paris.href,
    title: 'Course à obstacles à Paris et en Île-de-France | Overbound',
    description:
      `Overbound : une course à obstacles en boucles de 2 km en Île-de-France. OPEN pour courir à ton rythme, RANKED pour aller au bout. Prochaine édition ${next.window}.`,
    eyebrow: 'Course à obstacles en Île-de-France',
    heading: 'Une course à obstacles à Paris, en boucles de 2 km',
    answer:
      `Overbound est une course à obstacles organisée en Île-de-France. Le parcours est une boucle d'environ 2 km avec plus de 10 obstacles, que l'on répète. En format OPEN, tu choisis ton départ et ton rythme. En format RANKED, tu restes en course le plus longtemps possible. La prochaine édition aura lieu ${next.window}.`,
    facts: commonFacts(next),
    sections: [
      {
        heading: 'Comment ça se passe',
        paragraphs: [
          `Tu cours une boucle de ${FORMAT_FACTS.loopKm} km semée de plus de 10 obstacles, puis tu repars pour un nouveau tour. Le nombre de tours dépend de ton format et de ton envie d'aller loin.`,
          "Le même parcours sert aux deux formats. Tu n'as donc pas à choisir entre une course pour débutants et une course pour confirmés : tu choisis la façon de courir.",
        ],
      },
      {
        heading: 'OPEN ou RANKED : lequel choisir',
        paragraphs: [
          `OPEN : ${FORMAT_FACTS.open.summary} C'est le bon choix pour une première course à obstacles, pour courir entre amis ou en famille adulte, ou pour enchaîner autant de tours que tu le souhaites.`,
          `RANKED : ${FORMAT_FACTS.ranked.summary} C'est le choix de celles et ceux qui veulent un vrai défi et un classement.`,
        ],
      },
      {
        heading: 'Où et quand',
        paragraphs: [
          `La première édition s'est tenue le ${PREVIOUS_EDITION.dateLabel} à l'${PREVIOUS_EDITION.venue}, avec ${PREVIOUS_EDITION.participants}.`,
          `La prochaine édition est prévue ${next.window}. ${next.detailsStatus}`,
        ],
      },
    ],
    faq: [
      {
        question: 'Où se déroule la course à obstacles Overbound ?',
        answer: `Overbound se déroule en Île-de-France. La dernière édition a eu lieu à l'${PREVIOUS_EDITION.venue}. ${next.confirmed ? next.detailsStatus : "Le lieu de l'édition 2027 sera annoncé dès sa confirmation."}`,
      },
      {
        question: 'Quand a lieu la prochaine course Overbound ?',
        answer: `La prochaine édition est prévue ${next.window}. ${next.detailsStatus}`,
      },
      {
        question: 'Faut-il être sportif pour participer ?',
        answer:
          "Le format OPEN est pensé pour courir à son rythme, sans classement et sans temps limite par tour. Tu peux t'arrêter quand tu veux. Le format RANKED demande une bonne condition physique.",
      },
      {
        question: 'Quel âge faut-il avoir ?',
        answer: `Il faut avoir ${FORMAT_FACTS.minAge} ans minimum.`,
      },
    ],
    related: [PILLAR_LINKS.loops, PILLAR_LINKS.facts, { href: '/events/formats', label: 'Comparer OPEN et RANKED' }],
  },

  loops: {
    path: PILLAR_LINKS.loops.href,
    title: "Course à obstacles en boucles, inspirée du backyard ultra | Overbound",
    description:
      "Overbound reprend le principe du backyard ultra : une boucle répétée, jusqu'au dernier debout, appliquée à une course à obstacles de 2 km. Découvre les règles.",
    eyebrow: 'Le format',
    heading: 'La course à obstacles en boucles, inspirée du backyard ultra',
    answer:
      "Un backyard ultra est une course où l'on répète la même boucle, tour après tour, jusqu'à ce qu'il ne reste qu'un coureur. Overbound applique cette idée à une course à obstacles : une boucle d'environ 2 km avec plus de 10 obstacles, répétée. Le format RANKED suit l'élimination, le format OPEN laisse courir sans classement.",
    facts: [
      { label: 'Principe', value: 'Une boucle répétée, tour après tour' },
      { label: 'Boucle', value: `${FORMAT_FACTS.loopKm} km, 10+ obstacles` },
      { label: 'RANKED', value: `Départ unique à ${FORMAT_FACTS.ranked.departure}, élimination` },
      { label: 'OPEN', value: 'Sans classement, départs par vagues' },
      { label: 'Dernière édition', value: `${PREVIOUS_EDITION.dateLabel}, ${PREVIOUS_EDITION.venue}` },
      { label: 'Prochaine édition', value: next.shortLabel },
    ],
    sections: [
      {
        heading: "Le principe d'un backyard ultra",
        paragraphs: [
          "Dans un backyard ultra, tous les coureurs repartent ensemble à chaque heure sur la même boucle. Celui qui ne termine pas son tour dans le temps imparti est éliminé. La course continue jusqu'à ce qu'un seul coureur finisse un tour.",
          "Overbound garde l'idée centrale, la répétition d'une même boucle, et l'adapte à la course à obstacles.",
        ],
      },
      {
        heading: "Ce qu'Overbound change",
        paragraphs: [
          `La boucle fait environ ${FORMAT_FACTS.loopKm} km et comporte plus de 10 obstacles. Franchir les obstacles fait partie du tour.`,
          `En RANKED, le temps limite par tour diminue au fil de la course : ${FORMAT_FACTS.ranked.lapLimits}.`,
          "En OPEN, il n'y a pas de classement : tu enchaînes les tours à ton rythme, avec un départ en vague choisi à l'avance.",
        ],
      },
      {
        heading: 'À qui ça s’adresse',
        paragraphs: [
          "Aux coureurs d'ultra qui veulent un format de boucles avec des obstacles, aux pratiquants de course à obstacles qui veulent aller plus loin, et aux débutants qui veulent essayer sans pression grâce au format OPEN.",
        ],
      },
    ],
    faq: [
      {
        question: "Qu'est-ce qu'un backyard ultra ?",
        answer:
          "C'est une course où l'on répète la même boucle à intervalles réguliers. Un coureur éliminé est celui qui ne finit pas un tour à temps. Le dernier coureur en course gagne.",
      },
      {
        question: "Overbound est-il un backyard ultra ?",
        answer:
          "Overbound s'inspire du backyard ultra : même principe de boucle répétée et d'élimination en RANKED. C'est une variante, avec des obstacles et des temps limites qui diminuent, pas un backyard au sens strict.",
      },
      {
        question: 'Combien de tours faut-il faire ?',
        answer:
          "En OPEN, autant que tu le souhaites dans la plage horaire de l'événement. En RANKED, autant que tu peux tenir : tu es éliminé si tu dépasses le temps limite d'un tour.",
      },
    ],
    related: [PILLAR_LINKS.paris, PILLAR_LINKS.facts, { href: '/events/formats', label: 'Comparer OPEN et RANKED' }],
  },

  facts: {
    path: PILLAR_LINKS.facts.href,
    title: 'Overbound en bref : formats, dernière édition, prochaine date',
    description:
      `Les faits sur Overbound : course à obstacles en boucles de 2 km, formats OPEN et RANKED, édition 2026 à Saint-Quentin-en-Yvelines, prochaine édition ${next.window}.`,
    eyebrow: 'Les faits',
    heading: 'Overbound en bref',
    answer:
      `Overbound est une course à obstacles en boucles d'environ 2 km, organisée en Île-de-France. Elle propose deux formats, OPEN sans classement et RANKED par élimination. La première édition a réuni plus de 300 participants le 12 septembre 2026 à Saint-Quentin-en-Yvelines. La prochaine est prévue ${next.window}.`,
    facts: [
      { label: 'Nom', value: `${BRAND.name} (${BRAND.tagline})` },
      { label: 'Zone', value: BRAND.area },
      ...commonFacts(next),
      { label: 'Départ RANKED', value: FORMAT_FACTS.ranked.summary },
      { label: 'Départs OPEN', value: FORMAT_FACTS.open.summary },
    ],
    sections: [
      {
        heading: 'Édition passée',
        paragraphs: [
          `${PREVIOUS_EDITION.name} : ${PREVIOUS_EDITION.dateLabel}, ${PREVIOUS_EDITION.venue}, ${PREVIOUS_EDITION.participants}.`,
        ],
      },
      {
        heading: 'Prochaine édition',
        paragraphs: [
          `Prévue ${next.window}. ${next.detailsStatus} Tu peux demander à être prévenu·e de l'ouverture sur la page Prochaine édition.`,
        ],
      },
    ],
    faq: [
      {
        question: "Qu'est-ce qu'Overbound ?",
        answer:
          "Overbound est une course à obstacles en boucles d'environ 2 km, organisée en Île-de-France, avec deux formats : OPEN et RANKED.",
      },
      {
        question: "Combien de personnes ont participé à l'édition 2026 ?",
        answer: `L'édition du ${PREVIOUS_EDITION.dateLabel} a réuni ${PREVIOUS_EDITION.participants}.`,
      },
      {
        question: "Comment être prévenu de l'ouverture des inscriptions 2027 ?",
        answer:
          "Laisse ton email sur la page Prochaine édition (/events). Tu recevras un message dès l'ouverture des inscriptions.",
      },
    ],
    related: [PILLAR_LINKS.paris, PILLAR_LINKS.loops, { href: '/events', label: 'Prochaine édition' }],
    video: true,
  },
})

export const PILLAR_PAGES = buildPillarPages()
