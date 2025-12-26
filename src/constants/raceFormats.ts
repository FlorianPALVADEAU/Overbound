import { Flag, Flame, Mountain, Target, Zap, LucideIcon } from 'lucide-react'

export type FormatTemplate =
  | 'ultra-arena'
  | 'tribal-kids'
  | 'origin'
  | 'horizon'

interface StatCard {
  label: string
  value: string
  icon: LucideIcon
  helper: string
}

interface FeatureCard {
  category: string
  title: string
  description: string
  colorClass: string
}

interface FormatBadge {
  text: string
  colorClass: string
}

interface FormatConfig {
  // Metadata
  id: FormatTemplate
  name: string
  slug: string

  // Hero section
  badge: FormatBadge
  heroDescription: string[]
  statsCards: StatCard[]

  // Concept section
  conceptTitle: string
  conceptParagraphs: string[]
  featureCards: FeatureCard[]

  // Obstacles section
  obstaclesTitle: string

  // Equipment section
  equipmentTitle: string
  equipmentItems: string[]

  // Progression
  progressionFrom?: FormatTemplate[]
  progressionTo?: FormatTemplate[]

  // Ideal profile
  idealProfile?: string[]

  // Prerequisites
  prerequisites?: {
    fitnessLevel: number // 1-10
    trainingWeeks: number
    skills: string[]
  }

  // Estimated time
  estimatedTimeMin?: number // in minutes
  estimatedTimeMax?: number // in minutes
}

export const RACE_FORMATS: Record<FormatTemplate, FormatConfig> = {
  'ultra-arena': {
    id: 'ultra-arena',
    name: 'Ultra Arena',
    slug: 'ultra-arena',

    badge: {
      text: 'PREMIÈRE MONDIALE - Format Backyard OCR',
      colorClass: 'bg-amber-500 text-white font-bold text-sm',
    },

    heroDescription: [
      '<span class="text-foreground font-semibold">Du jamais vu dans l\'OCR :</span> Le premier format backyard appliqué aux courses d\'obstacles. Inspiré du légendaire <a href="https://www.mattmahoney.net/barkley/" target="_blank" class="underline">Barkley Marathons</a>, la Ultra Arena n\'a pas de distance fixe.',
      '<span class="text-amber-600 font-semibold">Élimination progressive.</span> Chaque tour dure 1h maximum. Si tu ne reviens pas à temps, tu es éliminé. Le dernier debout gagne. C\'est un test mental et physique extrême réservé aux athlètes d\'élite.',
    ],

    statsCards: [
      {
        label: 'Format',
        value: 'Backyard OCR',
        icon: Flag,
        helper: "Premier format backyard appliqué à l'OCR au monde",
      },
      {
        label: 'Intensité',
        value: '10/10',
        icon: Flame,
        helper: 'Mental et physique extrême',
      },
      {
        label: 'Distance',
        value: '∞ km',
        icon: Mountain,
        helper: 'Élimination progressive - le dernier debout gagne',
      },
      {
        label: 'Obstacles',
        value: '∞ obstacles',
        icon: Zap,
        helper: "Répétés jusqu'à élimination complète",
      },
    ],

    conceptTitle: 'Le concept Backyard OCR',

    conceptParagraphs: [
      '<span class="text-foreground font-semibold">Inspiré du <a href="https://www.mattmahoney.net/barkley/" target="_blank" class="underline">Barkley Marathons</a></span>, la Ultra Arena introduit pour la première fois au monde le concept de backyard ultra à l\'obstacle course racing.',
      '<span class="text-amber-600 font-semibold">Le principe :</span> Chaque concurrent part pour un tour de 4 km avec 15+ obstacles extrêmes. Tu as 1h pour revenir. Si tu ne reviens pas à temps, tu es éliminé. Tous ceux qui reviennent à temps repartent pour un nouveau tour, et ainsi de suite jusqu\'à ce qu\'il ne reste qu\'un seul concurrent.',
      'Ce n\'est pas une course de distance, <span class="text-foreground font-semibold">c\'est un test de limites absolues</span>. Mental, physique, stratégie de récupération : tout est mis à l\'épreuve. Le dernier debout gagne.',
    ],

    featureCards: [
      {
        category: 'Format élimination',
        title: '1h par tour maximum',
        description:
          "Pas d'arrivée en avance. Chaque tour démarre toutes les heures, peu importe quand tu reviens. Gère ta récupération.",
        colorClass: 'bg-amber-500/5 ring-amber-500/20 text-amber-600',
      },
      {
        category: 'Pré-requis',
        title: "Mental d'acier obligatoire",
        description:
          "Conçu pour les athlètes avec une préparation physique et mentale extrême. Ce format n'est pas recommandé pour les débutants.",
        colorClass: 'bg-amber-500/5 ring-amber-500/20 text-amber-600',
      },
      {
        category: 'Objectif',
        title: 'Le dernier debout gagne',
        description:
          "Pas de classement, pas de chrono. Un seul gagnant : celui qui reste quand tous les autres ont abandonné.",
        colorClass: 'bg-amber-500/5 ring-amber-500/20 text-amber-600',
      },
    ],

    obstaclesTitle: 'Obstacles extrêmes',

    equipmentTitle: 'Équipement requis',
    equipmentItems: [
      'Chaussures de trail robustes avec excellente adhérence',
      'Gants de préhension renforcés (obligatoire)',
      'Frontale puissante (course de nuit possible)',
      'Vêtements techniques multicouches (météo variable)',
      'Nutrition et hydratation pour ultra-distance',
      'Récupération musculaire entre les tours (rouleaux, bandes)',
    ],

    idealProfile: [
      'Tu as déjà participé à plusieurs OCR longue distance',
      'Tu as une expérience en ultra-trail ou ultra-endurance',
      'Tu es capable de gérer mentalement l\'incertitude et la fatigue extrême',
      'Tu as une stratégie de nutrition et récupération éprouvée',
    ],

    prerequisites: {
      fitnessLevel: 10,
      trainingWeeks: 10,
      skills: [
        'Ultra-endurance',
        'Gestion mentale avancée',
        'Récupération rapide',
        'Maîtrise technique OCR',
      ],
    },

    progressionFrom: ['horizon'],
    progressionTo: [],
  },

  'tribal-kids': {
    id: 'tribal-kids',
    name: 'Tribal Kids',
    slug: 'tribal-kids',

    badge: {
      text: 'FORMAT FAMILLE - 6-14 ans',
      colorClass: 'bg-purple-500 text-white font-bold text-sm',
    },

    heroDescription: [
      '<span class="text-foreground font-semibold">L\'initiation parfaite à l\'OCR :</span> Des parcours d\'obstacles ludiques et sécurisés spécialement conçus pour les enfants de 6 à 14 ans.',
      '<span class="text-purple-600 font-semibold">3 distances adaptées par âge.</span> 1 km (6-8 ans), 2 km (9-11 ans), 3 km (12-14 ans). Avec 15 obstacles ludiques, progressifs et totalement sécurisés, les enfants découvrent l\'esprit Overbound dans un environnement bienveillant et stimulant.',
    ],

    statsCards: [
      {
        label: 'Âge',
        value: '6-14 ans',
        icon: Target,
        helper: "3 parcours adaptés par tranche d'âge",
      },
      {
        label: 'Distance',
        value: '1 / 2 / 3 km',
        icon: Mountain,
        helper: "Selon l'âge et le niveau de l'enfant",
      },
      {
        label: 'Obstacles',
        value: '15 obstacles',
        icon: Zap,
        helper: 'Ludiques, sécurisés et progressifs',
      },
    ],

    conceptTitle: "L'esprit Tribal Kids",

    conceptParagraphs: [
      '<span class="text-foreground font-semibold">Tribal Kids, c\'est bien plus qu\'une simple course</span> : c\'est une aventure conçue pour initier les enfants à l\'univers de l\'obstacle course racing dans un cadre ludique, sécurisé et bienveillant.',
      '<span class="text-purple-600 font-semibold">Notre approche :</span> Chaque parcours est adapté à l\'âge et au développement physique des enfants. Les obstacles sont pensés pour être relevés avec plaisir et confiance, tout en développant coordination, courage et esprit d\'équipe.',
      'Les enfants découvrent <span class="text-foreground font-semibold">les valeurs Overbound</span> : dépassement de soi, entraide et fierté collective. Un souvenir marquant qui peut éveiller une passion pour le sport et l\'aventure.',
    ],

    featureCards: [
      {
        category: 'Parcours adapté',
        title: '3 distances par âge',
        description:
          '1 km pour les 6-8 ans, 2 km pour les 9-11 ans, 3 km pour les 12-14 ans. Chaque parcours est pensé pour leur niveau.',
        colorClass: 'bg-purple-500/5 ring-purple-500/20 text-purple-600',
      },
      {
        category: 'Sécurité maximale',
        title: 'Obstacles sécurisés',
        description:
          'Tous les obstacles sont ludiques, progressifs et totalement sécurisés. Encadrement bienveillant et attentif.',
        colorClass: 'bg-purple-500/5 ring-purple-500/20 text-purple-600',
      },
      {
        category: 'Esprit collectif',
        title: 'Entraide et fierté',
        description:
          "Les enfants apprennent à s'encourager mutuellement et à célébrer les réussites de chacun.",
        colorClass: 'bg-purple-500/5 ring-purple-500/20 text-purple-600',
      },
    ],

    obstaclesTitle: 'Obstacles ludiques',

    equipmentTitle: "Ce qu'il faut prévoir",
    equipmentItems: [
      'Chaussures de sport fermées (baskets de running)',
      'Tenue de sport confortable (short/legging + t-shirt)',
      'Vêtements de rechange pour après la course',
      'Bouteille d\'eau personnelle',
      'Casquette ou bandana (si météo ensoleillée)',
      "Petite collation pour après l'effort",
    ],

    idealProfile: [
      'Ton enfant aime bouger et relever des défis',
      'Il/elle apprécie les activités en extérieur',
      'C\'est sa première expérience OCR ou il/elle veut progresser',
      'Tu cherches une activité sportive familiale et ludique',
    ],

    prerequisites: {
      fitnessLevel: 2,
      trainingWeeks: 0,
      skills: ['Coordination de base', 'Esprit aventurier'],
    },

    estimatedTimeMin: 40,
    estimatedTimeMax: 70,

    progressionFrom: [],
    progressionTo: [],
  },

  'origin': {
    id: 'origin',
    name: 'Origin',
    slug: 'origin',

    badge: {
      text: 'FORMAT SPRINT - 6 km',
      colorClass: 'bg-emerald-500 text-white font-bold text-sm',
    },

    heroDescription: [
      '<span class="text-foreground font-semibold">L\'initiation explosive à l\'OCR :</span> Origin est le format parfait pour découvrir l\'univers Overbound ou viser un chrono explosif.',
      '<span class="text-emerald-600 font-semibold">6 km, 20 obstacles.</span> Distance courte mais intense qui te permet de donner ton maximum du début à la fin. Accessible aux débutants motivés tout en offrant un vrai défi pour les athlètes confirmés qui cherchent la performance pure.',
    ],

    statsCards: [
      {
        label: 'Intensité',
        value: '7/10',
        icon: Flame,
        helper: 'Accessible mais intense - explosivité et cardio',
      },
      {
        label: 'Distance',
        value: '6 km',
        icon: Mountain,
        helper: 'Distance idéale pour donner tout sans retenue',
      },
      {
        label: 'Obstacles',
        value: '20 obstacles',
        icon: Zap,
        helper: 'Mix équilibré entre technique et puissance',
      },
    ],

    conceptTitle: "L'esprit Sprint",

    conceptParagraphs: [
      '<span class="text-foreground font-semibold">Origin, c\'est l\'essence même de l\'OCR concentrée sur 6 km</span> : vitesse, explosivité et intensité pure du premier au dernier obstacle.',
      '<span class="text-emerald-600 font-semibold">Format sprint :</span> La distance courte te permet de donner ton maximum sans retenue. Pas besoin de gérer ton effort sur la durée, juste de tout donner pendant 30 à 60 minutes d\'effort intense.',
      'C\'est <span class="text-foreground font-semibold">le format idéal pour débuter</span> dans l\'univers Overbound ou pour les athlètes confirmés qui recherchent la performance pure et le chrono. Accessible mais exigeant.',
    ],

    featureCards: [
      {
        category: 'Format explosif',
        title: 'Court et intense',
        description:
          '6 km de course où chaque mètre compte. Tu peux sprinter du début à la fin sans économiser ton énergie.',
        colorClass: 'bg-emerald-500/5 ring-emerald-500/20 text-emerald-600',
      },
      {
        category: 'Accessible',
        title: 'Idéal pour débuter',
        description:
          "La porte d'entrée parfaite dans l'univers Overbound. Distance accessible avec un vrai défi à relever.",
        colorClass: 'bg-emerald-500/5 ring-emerald-500/20 text-emerald-600',
      },
      {
        category: 'Performance',
        title: 'Vise le chrono',
        description:
          'Format parfait pour battre tes records personnels et te mesurer aux meilleurs sur une distance explosive.',
        colorClass: 'bg-emerald-500/5 ring-emerald-500/20 text-emerald-600',
      },
    ],

    obstaclesTitle: 'Obstacles explosifs',

    equipmentTitle: 'Équipement sprint',
    equipmentItems: [
      'Chaussures de trail légères avec bonne accroche',
      'Gants de préhension (recommandé)',
      'Tenue technique respirante (short + t-shirt)',
      'Petite gourde ou système d\'hydratation léger',
      'Casquette ou bandana',
      'Nutrition rapide (gel énergétique)',
    ],

    idealProfile: [
      'Tu veux découvrir l\'OCR sans t\'engager sur une longue distance',
      'Tu cherches un format explosif où tu peux sprinter',
      'Tu veux tester ton niveau ou viser un chrono',
      'Tu as une bonne condition physique de base',
    ],

    prerequisites: {
      fitnessLevel: 6,
      trainingWeeks: 4,
      skills: ['Cardio de base', 'Force fonctionnelle', 'Coordination'],
    },

    estimatedTimeMin: 40,
    estimatedTimeMax: 100,

    progressionFrom: [],
    progressionTo: ['horizon'],
  },

  'horizon': {
    id: 'horizon',
    name: 'Horizon',
    slug: 'horizon',

    badge: {
      text: 'FORMAT INTERMÉDIAIRE - 12 km',
      colorClass: 'bg-blue-500 text-white font-bold text-sm',
    },

    heroDescription: [
      '<span class="text-foreground font-semibold">Le défi équilibré :</span> Horizon combine endurance, technique et mental pour un test complet de tes capacités.',
      '<span class="text-blue-600 font-semibold">12 km, 35 obstacles.</span> Distance médium qui demande gestion d\'effort et stratégie. Avec des portés lourds, des obstacles techniques répétés et une vraie dimension cardio, c\'est le tremplin idéal pour progresser vers les formats élite.',
    ],

    statsCards: [
      {
        label: 'Intensité',
        value: '8/10',
        icon: Flame,
        helper: "Exigeant - test d'endurance et de mental",
      },
      {
        label: 'Distance',
        value: '12 km',
        icon: Mountain,
        helper: "Endurance nécessaire avec gestion d'effort",
      },
      {
        label: 'Obstacles',
        value: '35 obstacles',
        icon: Zap,
        helper: 'Portés lourds et obstacles techniques répétés',
      },
    ],

    conceptTitle: 'Philosophie de la progression',

    conceptParagraphs: [
      '<span class="text-foreground font-semibold">Horizon, c\'est le pont entre le sprint et l\'élite</span> : une distance qui te force à sortir de ta zone de confort sans t\'écraser.',
      '<span class="text-blue-600 font-semibold">Format intermédiaire :</span> 12 km, c\'est assez long pour que la gestion d\'effort devienne cruciale, mais assez court pour que tu puisses maintenir une vraie intensité. Les 35 obstacles te demandent technique, force et mental.',
      'C\'est <span class="text-foreground font-semibold">le tremplin parfait</span> pour passer du format découverte aux formats élite. Un vrai test complet qui révèle tes points forts et ce qu\'il te reste à travailler.',
    ],

    featureCards: [
      {
        category: 'Équilibre',
        title: 'Endurance + technique',
        description:
          'La distance idéale pour combiner cardio, force et technique sans compromis sur aucun aspect.',
        colorClass: 'bg-blue-500/5 ring-blue-500/20 text-blue-600',
      },
      {
        category: 'Progression',
        title: 'Vers les formats élite',
        description:
          "Le format qui te prépare mentalement et physiquement à affronter les distances extrêmes d'Overbound.",
        colorClass: 'bg-blue-500/5 ring-blue-500/20 text-blue-600',
      },
      {
        category: 'Stratégie',
        title: "Gestion d'effort cruciale",
        description:
          "Tu dois gérer ton rythme, ta nutrition et ton mental. C'est un vrai apprentissage de l'endurance en OCR.",
        colorClass: 'bg-blue-500/5 ring-blue-500/20 text-blue-600',
      },
    ],

    obstaclesTitle: 'Obstacles techniques',

    equipmentTitle: 'Équipement intermédiaire',
    equipmentItems: [
      'Chaussures de trail avec bon amorti et accroche',
      'Gants de préhension renforcés (obligatoire)',
      'Sac d\'hydratation ou ceinture porte-gourdes',
      'Nutrition pour effort prolongé (gels, barres)',
      'Vêtements techniques (compression recommandée)',
      'Bandage de maintien si nécessaire (genoux, chevilles)',
    ],

    idealProfile: [
      'Tu as déjà fait un ou plusieurs sprint OCR',
      'Tu cherches à augmenter ton volume et ton endurance',
      'Tu veux te tester sur une distance qui demande stratégie',
      'Tu envisages de passer aux formats élite',
    ],

    prerequisites: {
      fitnessLevel: 7,
      trainingWeeks: 8,
      skills: [
        'Endurance cardiovasculaire',
        'Force fonctionnelle solide',
        'Technique OCR intermédiaire',
        'Gestion d\'effort',
      ],
    },

    estimatedTimeMin: 100,
    estimatedTimeMax: 160,

    progressionFrom: ['origin'],
    progressionTo: ['ultra-arena'],
  },
}

// Helper function to get format config by race ID or name
export function getFormatConfig(
  raceId: string,
  raceName?: string | null,
  formatTemplate?: string | null
): FormatConfig | null {
  // First, check if formatTemplate is provided
  if (formatTemplate && formatTemplate in RACE_FORMATS) {
    return RACE_FORMATS[formatTemplate as FormatTemplate]
  }

  switch (raceId) {
    case 'ultra-arena':
      return RACE_FORMATS['ultra-arena']
    case 'tribal-kids':
      return RACE_FORMATS['tribal-kids']
    case 'origin':
      return RACE_FORMATS['origin']
    case 'horizon':
      return RACE_FORMATS['horizon']
  
    default:
      console.error("cannot retrieve race... [0x01BDSQ7]")
      return null;
  }
}

export const FORMAT_TEMPLATES = Object.values(RACE_FORMATS)

export const FORMAT_OPTIONS = FORMAT_TEMPLATES.map((format) => ({
  value: format.id,
  label: format.name,
}))
