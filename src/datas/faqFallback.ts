import type { PortableTextBlock } from '@portabletext/types'
import type { FAQDocument } from '@/app/about/faq/FAQPageContent'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'
import { OPEN_FORMAT_RULES, RANKED_FORMAT_RULES, RANKED_LAP_TIME_LIMITS_SUMMARY, SHARED_FORMAT_RULES } from '@/constants/raceFormatRules'

export const block = (text: string): PortableTextBlock => ({
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
    title: 'C’est quoi Overbound ?',
    shortAnswer: `Une course à obstacles sur une boucle d’environ ${SHARED_FORMAT_RULES.loopKm} km, à répéter autant de fois que tu veux ou peux.`,
    answer: [
      block(
        `Overbound est une course à obstacles sur une boucle d’environ ${SHARED_FORMAT_RULES.loopKm} km. Tu choisis ton niveau de défi sur le même parcours : OPEN pour courir à ton rythme, RANKED pour la compétition.`,
      ),
    ],
    category: 'general',
    order: 1,
    relatedLinks: [{ label: 'Voir les formats', href: '/events/formats' }],
  },
  {
    _id: 'fallback-general-open-ranked',
    title: 'Quelle différence entre OPEN et RANKED ?',
    shortAnswer: 'OPEN : tu choisis ton créneau et ton rythme. RANKED : départ unique, tours chronométrés.',
    answer: [
      block(
        `En OPEN, tu choisis un créneau de départ entre ${OPEN_FORMAT_RULES.firstSasDeparture} et ${OPEN_FORMAT_RULES.lastSasDeparture} et tu enchaînes les tours à ton rythme, jusqu’à la fermeture du parcours à ${OPEN_FORMAT_RULES.courseClosing}.`,
      ),
      block(
        `En RANKED, le départ est unique à ${RANKED_FORMAT_RULES.departure} et chaque tour est chronométré : ${RANKED_LAP_TIME_LIMITS_SUMMARY}. Un tour hors délai met fin à ta course.`,
      ),
    ],
    category: 'general',
    order: 2,
    relatedLinks: [{ label: 'Comparer les formats', href: '/events/formats' }],
  },
  {
    _id: 'fallback-general-next-edition',
    title: 'Quand a lieu la prochaine édition ?',
    shortAnswer: 'Elle n’est pas encore annoncée.',
    answer: [
      block(
        'La prochaine édition n’est pas encore annoncée. Les dates et l’ouverture de la billetterie seront communiquées sur nos réseaux sociaux.',
      ),
    ],
    category: 'general',
    order: 3,
    relatedLinks: [{ label: 'Nous suivre sur Instagram', href: 'https://www.instagram.com/overbound.race/' }],
  },
  {
    _id: 'fallback-inscriptions-how',
    title: 'Comment m’inscrire ?',
    shortAnswer: 'Crée ton compte, choisis ton billet, renseigne les participants et paie en ligne.',
    answer: [
      block('Connecte-toi à ton compte, puis choisis l’événement et ton billet. Ensuite :'),
      ...bulletList([
        'Renseigne les informations de chaque participant.',
        'Choisis ton créneau de départ si tu es en OPEN.',
        'Accepte le règlement, puis valide le paiement.',
      ]),
      block('Tu reçois ensuite un e-mail de confirmation avec ton billet et son QR code.'),
    ],
    category: 'inscriptions',
    order: 1,
    relatedLinks: [{ label: 'Mon compte', href: '/account' }],
  },
  {
    _id: 'fallback-inscriptions-transfert',
    title: 'Puis-je transférer mon billet à quelqu’un ?',
    shortAnswer: 'Oui, gratuitement, jusqu’à la veille de l’événement.',
    answer: [
      block(
        'Depuis ton espace billets, copie le lien de transfert et envoie-le à la personne qui reprend ta place. Elle se connecte, complète ses informations et accepte le règlement.',
      ),
      block('Le transfert est possible jusqu’à la veille de l’événement. Après, il n’est plus garanti.'),
    ],
    category: 'inscriptions',
    order: 2,
    relatedLinks: [
      { label: 'Mes billets', href: '/account/tickets' },
      { label: 'CGV', href: '/cgv#transfert' },
    ],
  },
  {
    _id: 'fallback-inscriptions-annulation',
    title: 'Puis-je annuler ou me faire rembourser ?',
    shortAnswer: 'Non. Les billets ne sont ni remboursables ni échangeables contre un avoir.',
    answer: [
      block(
        'Une inscription concerne une activité sportive datée : le droit de rétractation de 14 jours ne s’applique pas. Aucun remboursement ni avoir n’est accordé, quelle que soit la raison.',
      ),
      block('Tu peux en revanche transférer ton billet jusqu’à la veille de l’événement.'),
    ],
    category: 'inscriptions',
    order: 3,
    relatedLinks: [{ label: 'CGV', href: '/cgv#annulation-participant' }],
  },
  {
    _id: 'fallback-preparation-training',
    title: 'Comment me préparer ?',
    shortAnswer: 'Cardio, renforcement et un peu de grip, sur quelques semaines.',
    answer: [
      block('Un mélange de course à pied, de fractionné et de renforcement (gainage, tractions, pompes) suffit pour débuter.'),
      ...bulletList([
        '3 à 4 séances par semaine pendant environ 8 semaines.',
        'Alterner sorties longues, fractionné et travail de grip.',
        'Enchaîner de temps en temps plusieurs boucles de 2 km pour t’habituer à la répétition.',
      ]),
    ],
    category: 'preparation',
    order: 1,
    relatedLinks: [{ label: 'Quel format pour moi ?', href: '/events/formats' }],
  },
  {
    _id: 'fallback-logistique-arrivee',
    title: 'Quand arriver le jour de la course ?',
    shortAnswer: 'Environ une heure avant ton départ.',
    answer: [
      block(
        'Arrive au moins 1 heure avant ton départ pour le retrait du dossard, le briefing et l’échauffement. Une consigne est disponible sur place pour tes affaires (2 € par sac).',
      ),
      block('Le briefing sécurité est obligatoire pour accéder à la ligne de départ.'),
    ],
    category: 'logistique',
    order: 1,
    relatedLinks: [{ label: 'Règlement officiel', href: OFFICIAL_RULEBOOK_PDF_PATH }],
  },
  {
    _id: 'fallback-apres-course-media',
    title: 'Comment récupérer mes photos ?',
    shortAnswer: 'Un lien personnel t’est envoyé par e-mail sous 72 h.',
    answer: [
      block(
        'Ton QR code permet d’associer automatiquement les photos à ton profil. Tu reçois sous 72 heures un e-mail avec le lien vers tes photos.',
      ),
    ],
    category: 'apres-course',
    order: 1,
  },
  {
    _id: 'fallback-presse-contact',
    title: 'Je suis journaliste ou partenaire potentiel : qui contacter ?',
    shortAnswer: 'press@overbound-race.com pour la presse, partners@overbound-race.com pour les partenariats.',
    answer: [
      block('Presse : press@overbound-race.com. Partenariats et sponsoring : partners@overbound-race.com.'),
      block('Le dossier de sponsoring 2026 est téléchargeable sur la page Partenaires & presse.'),
    ],
    category: 'presse',
    order: 1,
    relatedLinks: [{ label: 'Partenaires & presse', href: '/about/partners' }],
  },
]
