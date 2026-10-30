import { HEALTH_PROOF } from '@/constants/participantNotice'
import { OPEN_FORMAT_RULES, RANKED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { FALLBACK_NEXT_EDITION, type NextEditionFacts } from '@/lib/seo/nextEdition'
import { BRAND, FORMAT_FACTS, PREVIOUS_EDITION, SITE_URL } from '@/lib/seo/siteFacts'
import { buildBreadcrumbJsonLd } from '@/lib/seo/structuredData'
import { formatTransferFee, TICKET_TRANSFER_FEE_CENTS } from '@/lib/tickets/transferPolicy'
import { buildDiscountLadder, B2B_REFERENCE_PRICES_CENTS, formatEuros } from './offer'

export const ENTERPRISE_PATH = '/entreprises'
export const ENTERPRISE_TITLE = 'Team building : course à obstacles pour entreprises | Overbound'

export const enterpriseDescription = () =>
  'Team building sportif en Île-de-France : une course à obstacles pour souder vos équipes, remise de 10 à 20 % dès 2 billets, facture entreprise.'

/** Answer-first paragraph (40 to 60 words), quotable as is. */
export const enterpriseAnswer = (next: NextEditionFacts = FALLBACK_NEXT_EDITION) =>
  `Overbound propose aux entreprises une course à obstacles en Île-de-France pour souder une équipe : une boucle de ${FORMAT_FACTS.loopKm} km, plus de 10 obstacles, un créneau de départ commun pour l'équipe. ` +
  `Une remise de groupe de 10 à 20 % s'applique dès 2 billets, tous formats. Prochaine édition ${next.window}.`

/** Venue conditions come from the last edition: say so until the next venue is announced, then point to it. */
const nextVenueNote = (next: NextEditionFacts) =>
  next.venue
    ? `Lieu de la prochaine édition : ${next.venue}. Ces conditions peuvent différer : vérifiez-les sur la page de l'événement avant de réserver.`
    : "Ces informations seront confirmées avec le lieu de la prochaine édition."

export interface EnterpriseFaq {
  question: string
  answer: string
}

export const buildEnterpriseFaq = (next: NextEditionFacts = FALLBACK_NEXT_EDITION): EnterpriseFaq[] => {
  const ladder = buildDiscountLadder()
  const rates = ladder.map((row) => `${row.percent} % à partir de ${row.minTickets} billets`).join(', ')
  const top = ladder[ladder.length - 1]
  return [
    {
      question: 'Faut-il être sportif pour participer ?',
      answer: `Non. En format OPEN il n'y a ni classement ni temps limite par tour : chaque participant choisit son heure de départ et son nombre de tours. Le dernier tour doit être lancé avant ${OPEN_FORMAT_RULES.lastLapStart} et le parcours ferme à ${OPEN_FORMAT_RULES.courseClosing}. Le format RANKED, en élimination, s'adresse à ceux qui veulent se mesurer.`,
    },
    {
      question: "Toute l'équipe peut-elle partir ensemble ?",
      answer: `En RANKED, le départ est unique pour tous à ${RANKED_FORMAT_RULES.departure}. En OPEN, chaque participant choisit son créneau, toutes les ${OPEN_FORMAT_RULES.sasIntervalMinutes} minutes de ${OPEN_FORMAT_RULES.firstSasDeparture} à ${OPEN_FORMAT_RULES.lastSasDeparture} : il suffit de choisir le même créneau pour toute l'équipe, dans la limite des places disponibles. Pour une grande équipe, réservez tôt ou précisez-le dans votre demande de devis.`,
    },
    {
      question: "S'agit-il d'une journée privée pour l'entreprise ?",
      answer: `Non. Overbound est un événement ouvert à tous, avec ${PREVIOUS_EDITION.participants} à la dernière édition. Votre équipe court aux côtés des autres participants. Il n'y a ni animateur, ni repas d'équipe inclus. Pour un projet sur mesure, décrivez-le dans la demande de devis.`,
    },
    {
      question: 'Que comprend le billet ?',
      answer: "Le dossard officiel, le chronométrage, la médaille finisher et l'accès au village. Le T-shirt finisher et le pack photo sont en option, par personne.",
    },
    {
      question: 'Chaque participant doit-il fournir un justificatif de santé ?',
      answer: `À la dernière édition, chaque participant devait présenter le ${HEALTH_PROOF.name} délivré par ${HEALTH_PROOF.issuer}, ou ${HEALTH_PROOF.alternative}. Il est contrôlé ${HEALTH_PROOF.checkpoint}, avec une pièce d'identité. Sans justificatif valable, le départ est refusé et le billet n'est pas remboursé. ${next.confirmed ? "Vérifiez la règle de la prochaine édition sur la page de l'événement" : "La règle de la prochaine édition sera confirmée à l'ouverture des ventes"} : prévenez vos collaborateurs dès la réservation.`,
    },
    {
      question: 'Y a-t-il des douches, des vestiaires et un parking ?',
      answer: `À la dernière édition, il n'y avait pas de douches ni de vestiaires, seulement des toilettes publiques : prévoyez des vêtements de rechange. Le parking était payant (6 € par véhicule) et le site était accessible en transports en commun comme en voiture. ${nextVenueNote(next)}`,
    },
    {
      question: 'Quand et où a lieu la prochaine édition ?',
      answer: `Prochaine édition ${next.window}. ${next.detailsStatus} La dernière édition a eu lieu le ${PREVIOUS_EDITION.dateLabel}, ${PREVIOUS_EDITION.venue}, avec ${PREVIOUS_EDITION.participants}.`,
    },
    {
      question: 'Comment fonctionne la remise de groupe ?',
      answer: `Elle s'applique à tous les billets d'une même commande, sans code à saisir : ${rates}. Les billets OPEN et RANKED comptent ensemble et reçoivent le même pourcentage. À titre d'exemple, un billet OPEN à ${formatEuros(B2B_REFERENCE_PRICES_CENTS.open)} passe à ${formatEuros(top.openUnitCents)} à partir de ${top.minTickets} billets, un billet RANKED à ${formatEuros(B2B_REFERENCE_PRICES_CENTS.ranked)} passe à ${formatEuros(top.rankedUnitCents)}. La remise ne se cumule pas avec un code promo : la réduction la plus avantageuse s'applique.`,
    },
    {
      question: "Peut-on recevoir une facture au nom de l'entreprise, et payer par virement ?",
      answer: "Oui pour la facture. Les prix sont affichés toutes taxes comprises (TTC). Précisez dans votre demande de devis que vous souhaitez une facture au nom de l'entreprise, avec la TVA. Le paiement se fait par carte bancaire, ou par virement SEPA selon disponibilité : indiquez votre préférence dans la demande.",
    },
    {
      question: "Un collaborateur ne peut plus venir : que se passe-t-il ?",
      answer: `Le billet n'est pas remboursable, mais il peut être transféré à un collègue depuis l'espace personnel, jusqu'à la veille de l'événement. Le transfert coûte ${formatTransferFee(TICKET_TRANSFER_FEE_CENTS)} TTC par billet (article 8 des CGV).`,
    },
    {
      question: 'Quel est l\'âge minimum ?',
      answer: `L'âge minimum est de ${FORMAT_FACTS.minAge} ans.`,
    },
    {
      question: "Proposez-vous autre chose que des billets ?",
      answer: "Oui, en option : T-shirt finisher, pack photo, et des projets sur mesure (challenge inter-services, séminaire) ou un partenariat avec visibilité sur l'événement. Décrivez votre besoin dans le formulaire de devis.",
    },
  ]
}

export interface GoodToKnow {
  title: string
  text: string
}

/** What a buyer must know before booking for a team (not an offer: facts from the CGV and the event rules). */
export const buildGoodToKnow = (next: NextEditionFacts = FALLBACK_NEXT_EDITION): GoodToKnow[] => [
  {
    title: 'Un événement ouvert à tous',
    text: `Votre équipe court au milieu des autres participants : ${PREVIOUS_EDITION.participants} à la dernière édition. Ce n'est pas une journée privée avec animateur.`,
  },
  {
    title: 'Un justificatif de santé par personne',
    text: `${HEALTH_PROOF.name} ou ${HEALTH_PROOF.alternative}, contrôlé ${HEALTH_PROOF.checkpoint}. À demander à vos collaborateurs dès la réservation.`,
  },
  {
    title: 'Prix TTC, facture entreprise',
    text: 'Tarifs toutes taxes comprises. Facture au nom de l\'entreprise sur demande, paiement par carte ou par virement SEPA selon disponibilité.',
  },
  {
    title: 'Sur place',
    text: `À la dernière édition : village avec zones de repos et restauration, dépôt de sacs, spectateurs bienvenus. Parking payant (6 € par véhicule), accès possible en transports en commun comme en voiture. Pas de douches, et pas de vestiaires : des toilettes publiques. Prévoyez des vêtements de rechange. ${nextVenueNote(next)} Participants à partir de ${FORMAT_FACTS.minAge} ans.`,
  },
]

export const buildEnterpriseJsonLd = (next: NextEditionFacts = FALLBACK_NEXT_EDITION) => {
  const url = `${SITE_URL}${ENTERPRISE_PATH}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: ENTERPRISE_TITLE,
      description: enterpriseDescription(),
      inLanguage: 'fr-FR',
      isPartOf: { '@type': 'WebSite', name: BRAND.name, url: SITE_URL },
      about: { '@id': `${url}#service` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#service`,
      url,
      name: 'Team building sportif : course à obstacles pour entreprises',
      serviceType: 'Team building sportif',
      description: enterpriseDescription(),
      provider: { '@type': 'Organization', name: BRAND.name, url: SITE_URL },
      areaServed: { '@type': 'AdministrativeArea', name: 'Île-de-France' },
      audience: { '@type': 'BusinessAudience', name: 'Entreprises, CSE et services RH' },
    },
    buildBreadcrumbJsonLd([{ name: 'Entreprises', path: ENTERPRISE_PATH }]),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: buildEnterpriseFaq(next).map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ]
}
