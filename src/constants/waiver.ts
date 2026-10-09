/**
 * Text of the participant waiver, signed at checkout and again by the new holder
 * of a transferred bib. It lives here, as plain strings, so the exact wording a
 * participant signed can be fingerprinted server-side and stored with the
 * signature (see `src/lib/legal/waiverDocument.ts`).
 *
 * Any wording change must bump `REGULATION_VERSION` in `./registration.ts`.
 * Drafted without a lawyer's review (see docs/legal/2026-10-transfer-and-waiver-review.md).
 */

export const WAIVER_TITLE =
  'Décharge de responsabilité, acceptation des risques et autorisation d’utilisation d’image — Overbound'

export const WAIVER_SUMMARY =
  'En signant, tu reconnais les risques d’une course à obstacles, tu acceptes le règlement et les consignes de sécurité, et tu autorises l’utilisation de ton image prise pendant l’événement.'

export const WAIVER_INTRO =
  'En contrepartie de mon droit de participer à l’événement et aux activités connexes organisés par Overbound, je reconnais, comprends et accepte les points suivants.'

export interface WaiverClause {
  id: string
  text: string
}

export const WAIVER_CLAUSES: readonly WaiverClause[] = [
  {
    id: '1',
    text: 'Je reconnais que la participation à une course à obstacles comporte des risques importants, notamment : chutes, entorses, fractures, blessures liées à la chaleur, au froid, à l’eau, aux obstacles, aux autres participants, à des animaux, à des insectes ou à des plantes, ainsi qu’un risque de blessure grave, d’invalidité, de paralysie ou de décès.',
  },
  {
    id: '2',
    text: 'Je participe volontairement et en connaissance de ces risques, qui sont inhérents à la pratique. Cette acceptation ne couvre pas les dommages qui résulteraient d’une faute d’Overbound.',
  },
  {
    id: '3',
    text: 'Je m’engage à respecter le règlement de l’événement, le briefing de sécurité, les consignes des équipes Overbound et des signaleurs. En cas de danger inhabituel, je m’engage à interrompre ma participation et à prévenir immédiatement l’organisation.',
  },
  {
    id: '4',
    text: 'Dans les limites autorisées par la loi, je renonce, pour moi-même et mes ayants droit, à rechercher la responsabilité d’Overbound, de ses dirigeants, salariés, bénévoles, partenaires, prestataires et des propriétaires du site pour les dommages résultant des risques normaux de la pratique décrits au point 1 ou de mon propre comportement. Cette renonciation ne s’applique ni aux dommages corporels causés par une faute d’Overbound, ni à une faute lourde ou intentionnelle.',
  },
  {
    id: '5',
    text: 'J’atteste être apte physiquement à participer, ne pas avoir connaissance d’une contre-indication médicale à la pratique d’une course à obstacles, et avoir pris connaissance des exigences physiques de l’événement. Je fournirai tout justificatif de santé (Pass Prévention Santé, licence ou certificat médical) que l’organisation exigerait.',
  },
  {
    id: '6',
    text: 'Je certifie être majeur(e) (18 ans révolus). La participation à cette édition est réservée aux personnes majeures.',
  },
  {
    id: '7',
    text: 'J’autorise l’administration des premiers secours et de tout traitement médical d’urgence jugé nécessaire par les secours.',
  },
  {
    id: '8',
    text: 'Overbound n’est pas responsable de la perte, du vol ou de la dégradation de mes effets personnels, sauf faute de sa part.',
  },
  {
    id: '9',
    text: 'L’inscription à une activité de loisir à date déterminée est exclue du droit de rétractation (article L221-28 12° du Code de la consommation). L’inscription n’est pas remboursable à mon initiative, sauf si elle comporte l’option « billet flexible » (article 10 des CGV). Si Overbound annule l’événement, le prix du billet est remboursé à l’acheteur d’origine dans les conditions des CGV. Le dossard peut être transféré jusqu’à la veille de l’événement, dans les conditions de l’article 8 des CGV.',
  },
  {
    id: '10',
    text: 'Overbound peut reporter, modifier ou adapter l’événement pour des raisons de sécurité, de météo, de force majeure ou de contraintes administratives, sanitaires ou techniques. Les conséquences de ces décisions sont celles prévues par les CGV.',
  },
  {
    id: '11',
    text: 'Overbound est assurée en responsabilité civile auprès d’AXA France IARD, conformément à l’article L321-1 du Code du sport (plafond de 9 000 000 € par année d’assurance pour les dommages corporels). Cette assurance couvre les dommages dont Overbound est responsable. Elle ne couvre pas mes propres dommages corporels en l’absence de faute d’Overbound. Je suis informé(e) de l’intérêt de souscrire une assurance individuelle accident couvrant ces dommages. Le contrat et ses garanties sont détaillés à l’article 12 des CGV.',
  },
  {
    id: '12',
    text: 'Le dossard est personnel. Je présenterai une pièce d’identité au retrait du dossard. Overbound peut refuser le départ si mon identité ne correspond pas à celle du titulaire du dossard.',
  },
  {
    id: '13',
    text: 'Si j’ai reçu ce dossard par transfert, je deviens le seul titulaire de l’inscription. La signature de la personne qui me l’a transmis ne vaut pas pour moi : seule la présente signature m’engage.',
  },
  {
    id: '14',
    text: 'J’autorise gratuitement Overbound et ses partenaires médias à capter et diffuser mon image, ma voix, mon nom et ma performance enregistrés pendant l’événement, sur tout support, pour la promotion des événements et de la marque Overbound, dans le monde entier et pour une durée de 10 ans. Je peux m’opposer à toute nouvelle utilisation en écrivant à contact@overbound-race.com.',
  },
  {
    id: '15',
    text: 'Mes données personnelles sont traitées pour gérer mon inscription, ma sécurité et ma participation, selon la politique de confidentialité d’Overbound.',
  },
  {
    id: '16',
    text: 'Si j’inscris d’autres personnes dans ma commande, j’atteste agir avec leur accord, leur avoir transmis la présente décharge, le règlement et les CGV, et qu’elles en acceptent les termes. Je me porte fort de leur acceptation (article 1204 du Code civil). Chaque participant reçoit une copie de la décharge avec son billet.',
  },
  {
    id: '17',
    text: 'En signant, je confirme avoir lu et accepté le règlement officiel de l’événement, les CGU et CGV Overbound, ainsi que les obligations liées au dossard, au chronométrage et au matériel fourni.',
  },
]

/** Plain-text rendering of the whole waiver: what gets fingerprinted and emailed to the signer. */
export const WAIVER_PLAIN_TEXT = [
  WAIVER_TITLE,
  WAIVER_INTRO,
  ...WAIVER_CLAUSES.map((clause) => `${clause.id}. ${clause.text}`),
].join('\n\n')
