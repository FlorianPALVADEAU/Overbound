import type { PortableTextBlock } from '@portabletext/types'
import type { FAQDocument } from '@/app/about/faq/FAQPageContent'

const block = (text: string): PortableTextBlock => ({
  _key: text.slice(0, 16).replace(/\s+/g, '-'),
  _type: 'block',
  markDefs: [],
  style: 'normal',
  children: [
    {
      _key: `${text.slice(0, 12).replace(/\s+/g, '')}-child`,
      _type: 'span',
      text,
      marks: [],
    },
  ],
})

const bulletList = (items: string[]): PortableTextBlock[] =>
  items.map((text, index) => ({
    _key: `${text.slice(0, 12).replace(/\s+/g, '-')}-${index}`,
    _type: 'block',
    markDefs: [],
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [
      {
        _key: `${text.slice(0, 10).replace(/\s+/g, '')}-${index}-child`,
        _type: 'span',
        text,
        marks: [],
      },
    ],
  }))

export const faqFallback: FAQDocument[] = [
  {
    _id: 'fallback-general-what-is-overbound',
    title: 'Qu’est-ce que l’expérience Overbound ?',
    shortAnswer: 'Un parcours immersif mêlant course, obstacles naturels et esprit de cohésion.',
    answer: [
      block(
        'Overbound est une course à obstacles nouvelle génération qui combine endurance, franchissements techniques et immersion en pleine nature.',
      ),
      block(
        'Chaque édition propose différents formats (Sprint, Enduro, Team) pour s’adapter à ton niveau et t’offrir un véritable rite de passage moderne.',
      ),
      block(
        'Tu rejoins une communauté de passionnés qui recherchent le dépassement de soi et le partage. Prépare-toi à repousser tes limites, avec un encadrement professionnel et une ambiance mémorable.',
      ),
    ],
    category: 'general',
    relatedLinks: [
      { label: 'Découvrir Overbound', href: '/about' },
      { label: 'Voir les prochaines courses', href: '/events' },
    ],
  },
  {
    _id: 'fallback-general-overview',
    title: 'Comment finaliser mon inscription à une course Overbound ?',
    shortAnswer: 'Crée ton compte, choisis ta course et valide ton dossier en trois étapes simples.',
    answer: [
      block(
        'Pour finaliser ton inscription, connecte-toi à ton espace Overbound, choisis la course à laquelle tu veux participer et suis les étapes guidées.',
      ),
      block(
        'Une fois ton billet sélectionné, nous te demandons de compléter ton profil (coordonnées, niveau, objectifs) puis de téléverser les documents obligatoires.',
      ),
      ...bulletList([
        '1. Sélectionne la date et le format de course qui te correspond.',
        '2. Renseigne les informations participants et ajoute les options (assurance, pack photos).',
        '3. Upload ton certificat médical ou ton attestation de non contre-indication.',
      ]),
      block(
        'Dès que tout est validé, tu reçois un e-mail de confirmation avec ton QR code d’accès et les informations logistiques pour préparer ton défi.',
      ),
    ],
    category: 'inscriptions',
    relatedLinks: [
      { label: 'Créer mon compte', href: '/account' },
      { label: 'Consulter les formats', href: '/trainings/what-race-for-me' },
    ],
  },
  {
    _id: 'fallback-documents-certificate',
    title: 'Quels documents sont obligatoires avant le jour J ?',
    shortAnswer: 'Un certificat médical récent ou une attestation spécifique selon ton profil.',
    answer: [
      block(
        'Pour garantir ta sécurité, nous te demandons un certificat médical daté de moins de 6 mois mentionnant « course à obstacles » ou « pratique du sport en compétition ».',
      ),
      block(
        'Si tu es mineur, une autorisation parentale signée est également nécessaire. Les documents sont vérifiés automatiquement via notre application lors du check-in.',
      ),
      block(
        'Dès qu’ils sont validés, tu reçois un e-mail confirmant la conformité, et l’icône « documents manquants » disparaît de ton profil.',
      ),
    ],
    category: 'documents',
    relatedLinks: [
      { label: 'Gabarit certificat médical', href: '/documents/certificat.pdf' },
      { label: 'Voir la procédure de validation', href: '/about/faq#documents' },
    ],
  },
  {
    _id: 'fallback-preparation-training',
    title: 'Comment me préparer physiquement pour Overbound ?',
    shortAnswer: 'Travaille ton cardio, ta force fonctionnelle et ta technique d’obstacle grâce à nos programmes.',
    answer: [
      block(
        'Nos coachs recommandent un mix de courses longues, de fractionné et de renforcement fonctionnel (gainage, tractions, pompes).',
      ),
      ...bulletList([
        'Planifie 3 à 4 séances par semaine sur 8 semaines.',
        'Combine course à pied, HIIT et travail de grip.',
        'Test chaque mois ta capacité à franchir une série d’obstacles (suspension, mur, portés).',
      ]),
      block(
        'Retrouve des plans détaillés dans ton espace coureur et sur l’application Overbound Training.',
      ),
    ],
    category: 'preparation',
    relatedLinks: [
      { label: 'Programme 8 semaines', href: '/trainings/what-race-for-me' },
      { label: 'Télécharger l’app Training', href: '/app' },
    ],
  },
  {
    _id: 'fallback-logistique-arrivee',
    title: 'Quels sont les horaires et consignes le jour de la course ?',
    shortAnswer: 'Arrive 60 minutes avant ton créneau, passe au contrôle des documents, puis échauffement obligatoire.',
    answer: [
      block(
        'Nous t’invitons à arriver au moins 1 heure avant ton horaire de vague. Dirige-toi directement vers le village départ où nos bénévoles t’accueilleront.',
      ),
      block(
        'Documents, bracelet et dossard sont vérifiés sur place. Une consigne sécurisée est à ta disposition pour tes effets personnels (2 € par sac).',
      ),
      block(
        'Un échauffement collectif est animé 20 minutes avant chaque départ. Les briefing sécurité et parcours sont obligatoires pour accéder à la ligne de départ.',
      ),
    ],
    category: 'logistique',
    relatedLinks: [
      { label: 'Guide du participant', href: '/documents/guide-participant.pdf' },
      { label: 'Plan du village', href: '/about/faq#logistique' },
    ],
  },
  {
    _id: 'fallback-apres-course-media',
    title: 'Comment récupérer mes photos et vidéos après la course ?',
    shortAnswer: 'Un lien personnalisé est envoyé sous 72 h avec tout ton contenu média.',
    answer: [
      block(
        'Nos photographes couvrent chaque obstacle clé et la ligne d’arrivée. Ton QR code permet d’associer automatiquement les images à ton profil.',
      ),
      block(
        'Tu reçois sous 72 heures un e-mail avec le lien vers ta galerie personnelle. Les packs médias sont gratuits pour les formats Élite et Pack VIP.',
      ),
      block(
        'Tu peux partager tes meilleures photos directement sur les réseaux ou les télécharger en HD pour les imprimer.',
      ),
    ],
    category: 'apres-course',
    relatedLinks: [
      { label: 'Accéder à ma galerie', href: 'https://media.overbound.com' },
      { label: 'Upgrader vers le pack média', href: '/shop/media-pack' },
    ],
  },
  {
    _id: 'fallback-presse-contact',
    title: 'Je suis média ou partenaire, à qui dois-je m’adresser ?',
    shortAnswer: 'Notre pôle relations médias répond sous 24 h et t’oriente vers les bons contacts.',
    answer: [
      block(
        'Les journalistes, influenceurs et partenaires peuvent contacter directement le pôle presse via press@overbound-race.com.',
      ),
      block(
        'Nous proposons des accréditations média, des kits visuels, ainsi que des immersions sur nos parcours pour créer des contenus exclusifs.',
      ),
      block(
        'Pour une collaboration marque ou un partenariat local, décris-nous ton projet et nous te recontactons avec une proposition détaillée.',
      ),
    ],
    category: 'presse',
    relatedLinks: [
      { label: 'Kit presse complet', href: '/documents/kit-presse.zip' },
      { label: 'Demander une accréditation', href: '/contact' },
    ],
  },
]
