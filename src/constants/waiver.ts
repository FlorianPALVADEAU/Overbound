/**
 * Text of the participant waiver, signed at checkout and again by the new holder
 * of a transferred bib. It lives here, as plain strings, so the exact wording a
 * participant signed can be fingerprinted server-side and stored with the
 * signature (see `src/lib/legal/waiverDocument.ts`).
 *
 * Any wording change must bump `REGULATION_VERSION` in `./registration.ts`.
 * Insurance and health-proof wording comes from `./participantNotice.ts`.
 * Drafted without a lawyer's review (see docs/legal/2026-10-transfer-and-waiver-review.md).
 */

import {
  HEALTH_PROOF_MINOR_SENTENCE,
  HEALTH_PROOF_SENTENCE,
  MINOR_EMERGENCY_PROCEDURE,
  PARTICIPANTS_ARE_THIRD_PARTIES,
} from './participantNotice'

export const WAIVER_TITLE =
  'Décharge de responsabilité, acceptation des risques et autorisation d’utilisation d’image — Overbound'

export const WAIVER_SUMMARY =
  'En signant, tu reconnais les risques d’une course à obstacles, tu confirmes avoir compris ce que l’assurance d’Overbound couvre et ne couvre pas, tu t’engages à présenter ton PPS et ta pièce d’identité au retrait du dossard, tu acceptes le règlement et les consignes de sécurité, et tu autorises l’utilisation de ton image prise pendant l’événement. Pour un participant de 16 ou 17 ans, le représentant légal signe, ou donne son accord à la personne qui signe, et les clauses 18 à 21 s’ajoutent.'

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
    text: 'Dans les limites autorisées par la loi, je renonce, pour moi-même et mes ayants droit, à rechercher la responsabilité d’Overbound, de ses dirigeants, salariés, bénévoles, partenaires, prestataires et des propriétaires du site pour les dommages résultant des risques normaux de la pratique décrits au point 1 ou de mon propre comportement. Cette renonciation ne s’applique ni aux dommages corporels causés par une faute d’Overbound, ni à une faute lourde ou intentionnelle. Elle ne s’applique pas non plus à un participant de 16 ou 17 ans : son représentant légal reconnaît seulement avoir été informé des risques et des règles de sécurité, sans renoncer à aucun droit du mineur.',
  },
  {
    id: '5',
    text: `J’atteste être apte physiquement à participer, ne pas avoir connaissance d’une contre-indication médicale à la pratique d’une course à obstacles, et avoir pris connaissance des exigences physiques de l’événement. ${HEALTH_PROOF_SENTENCE} Je m’engage à le présenter. Pour un participant de 16 ou 17 ans, c’est la clause 19 qui s’applique.`,
  },
  {
    id: '6',
    text: 'Je certifie avoir 18 ans révolus le jour de l’événement. Par exception, quand l’événement est ouvert aux mineurs, une personne de 16 ou 17 ans le jour de l’événement peut participer au seul format OPEN, dans les conditions des clauses 18 à 21. Aucune participation n’est possible avant 16 ans, ni au format RANKED avant 18 ans.',
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
    text: `Overbound est assurée en responsabilité civile auprès d’AXA France IARD, conformément à l’article L321-1 du Code du sport (plafond de 9 000 000 € par année d’assurance pour les dommages corporels). Cette assurance couvre les dommages causés à des tiers, participants compris, lorsque la cause est imputable à Overbound. Elle ne couvre pas les dommages que je me cause à moi-même sans faute d’Overbound : mes frais médicaux, mon invalidité ou mon décès restent alors à ma charge. ${PARTICIPANTS_ARE_THIRD_PARTIES} Je suis informé(e) de l’intérêt de souscrire une assurance individuelle accident (indemnités en cas de blessure, d’invalidité ou de décès) et je reconnais avoir été invité(e) à vérifier mes garanties avant l’événement. Le contrat et ses garanties sont détaillés à l’article 12 des CGV.`,
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
  {
    id: '18',
    text: 'Participant de 16 ou 17 ans, représentant légal. Si le participant a 16 ou 17 ans le jour de l’événement, la personne qui signe la présente décharge atteste être son représentant légal (père, mère ou tuteur) ou agir avec l’accord de celui-ci. Le représentant légal autorise la participation du mineur au seul format OPEN, reconnaît avoir pris connaissance des risques décrits à la clause 1, et accepte, en son nom et pour le compte du mineur, les engagements de la présente décharge, à l’exception de la renonciation à recours de la clause 4, qui ne s’applique pas au mineur. Il garantit l’exactitude des coordonnées qu’il a communiquées pour lui-même et pour l’adulte référent, et leur joignabilité pendant toute la durée de l’événement. Le dossard d’un mineur ne peut être transféré qu’à une personne majeure.',
  },
  {
    id: '19',
    text: `Participant de 16 ou 17 ans, contrôle au retrait du dossard. Le mineur remet à l’organisation : l’autorisation parentale, sur le modèle fourni par Overbound, signée par le représentant légal et par le mineur ; sa pièce d’identité ; l’attestation de santé des mineurs. ${HEALTH_PROOF_MINOR_SENTENCE} L’adulte référent est également présent. Overbound conserve l’autorisation parentale, avec la présente décharge, jusqu’aux 28 ans du participant, la prescription d’une action en responsabilité ne courant qu’à sa majorité. Sans l’un de ces éléments, le départ est refusé et le prix du billet n’est pas remboursé.`,
  },
  {
    id: '20',
    text: 'Participant de 16 ou 17 ans, adulte référent et surveillance. L’adulte référent est une personne majeure, désignée à l’inscription, présente sur le site et joignable par téléphone pendant toute la participation du mineur. Il peut être le représentant légal. En dehors de l’épreuve (village, parking, attente, trajets), le mineur reste sous la responsabilité de son représentant légal et de l’adulte référent : Overbound n’assure ni garde ni surveillance de mineurs, ce qui ne remet pas en cause ses obligations de sécurité ni sa responsabilité pendant l’épreuve. Overbound peut refuser ou interrompre la participation d’un mineur dont l’adulte référent est absent ou injoignable.',
  },
  {
    id: '21',
    text: `Participant de 16 ou 17 ans, secours, image, données et assurance. ${MINOR_EMERGENCY_PROCEDURE} Le représentant légal autorise les premiers secours, tout traitement médical d’urgence et toute hospitalisation jugés nécessaires par les secours. Il donne, pour le mineur, l’autorisation d’image de la clause 14. Les noms et numéros de téléphone du représentant légal et de l’adulte référent servent à l’inscription, au contrôle des papiers et à les prévenir en cas d’incident ; ils sont effacés 30 jours après l’événement, selon la politique de confidentialité. Le représentant légal est informé de l’intérêt de souscrire, pour le mineur, une assurance individuelle accident, et reconnaît avoir été invité à vérifier les garanties dont le mineur bénéficie déjà (responsabilité civile familiale, assurance scolaire ou extrascolaire, licence). Les informations de la clause 11 sur l’assurance d’Overbound lui sont communiquées pour le mineur.`,
  },
]

/** Plain-text rendering of the whole waiver: what gets fingerprinted and emailed to the signer. */
export const WAIVER_PLAIN_TEXT = [
  WAIVER_TITLE,
  WAIVER_INTRO,
  ...WAIVER_CLAUSES.map((clause) => `${clause.id}. ${clause.text}`),
].join('\n\n')
