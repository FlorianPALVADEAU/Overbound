/**
 * What every participant must be told about their commitments, the risks they take and the
 * insurance cover, in one place. The CGV, the waiver, the checkout, the ticket email and the
 * transfer form all read from here, so they cannot drift apart.
 *
 * The insurance wording follows the contract (AXA France IARD, conditions particulières, page 2: sporting
 * participants are third parties between them) and the agency's written answers (October and November 2026):
 * the policy covers damage to third parties, participants included, when Overbound is at fault; it does not
 * cover damage participants cause to themselves; a participant's liability towards another may be covered,
 * subject to the policy's conditions. AXA did NOT confirm in writing that minors are covered, nor that a
 * transferred bib is: the texts must not claim either.
 *
 * Changing any wording that appears in the waiver requires bumping `REGULATION_VERSION`.
 * Drafted without a lawyer's review (see docs/legal/2026-10-transfer-and-waiver-review.md).
 */

/** Liability of a participant towards another, as the contract words it. One wording for every text. */
export const PARTICIPANTS_ARE_THIRD_PARTIES =
  'Le contrat d’Overbound précise que les pratiquants sportifs ont la qualité de tiers entre eux : la responsabilité civile d’un participant envers un autre participant peut donc être garantie, dans les limites et conditions du contrat. Overbound ne s’engage pas sur une prise en charge dans tous les cas : chaque participant vérifie aussi que sa responsabilité civile personnelle (assurance habitation, licence sportive) couvre ce cas.'

/** Health proof asked for this edition. Update for the next edition. */
export const HEALTH_PROOF = {
  required: true,
  /** Short name, as shown to participants. */
  name: 'Pass Prévention Santé (PPS)',
  issuer: 'la Fédération française d’athlétisme (FFA)',
  /** Accepted instead of the PPS. */
  alternative: 'une licence FFA en cours de validité',
  /** When it is checked, and what happens without it. */
  checkpoint: 'au retrait du dossard',
  consequence: 'Sans justificatif valable, le départ est refusé et le prix du billet n’est pas remboursé.',
} as const

export const HEALTH_PROOF_SENTENCE = `Pour cette édition, le ${HEALTH_PROOF.name} délivré par ${HEALTH_PROOF.issuer} est obligatoire (ou ${HEALTH_PROOF.alternative}). Il est contrôlé ${HEALTH_PROOF.checkpoint}, avec une pièce d’identité. ${HEALTH_PROOF.consequence}`

/**
 * Health proof asked of a participant aged 16 or 17 (events open to minors only). To confirm with the FFA
 * before opening an event to minors: that Overbound can be selected on pps.athle.fr, and what a "yes" answer
 * to the questionnaire leads to. Change the wording here and nowhere else.
 */
export const HEALTH_PROOF_MINOR = {
  name: 'attestation du questionnaire de santé pour mineurs',
  issuer: 'la FFA',
  /** Accepted instead of the attestation. */
  alternative: 'une licence FFA en cours de validité',
  /** Asked when an answer of the questionnaire is "yes". */
  certificate: 'un certificat médical d’absence de contre-indication à la pratique de la course à obstacles, de moins de six mois',
} as const

export const HEALTH_PROOF_MINOR_SENTENCE = `Pour un participant de 16 ou 17 ans, le ${HEALTH_PROOF.name} est remplacé par l’${HEALTH_PROOF_MINOR.name} délivrée par ${HEALTH_PROOF_MINOR.issuer}, remplie avec un représentant légal (ou ${HEALTH_PROOF_MINOR.alternative}). Si une réponse du questionnaire est « oui », ${HEALTH_PROOF_MINOR.certificate} est exigé à la place. ${HEALTH_PROOF.consequence}`

/** What happens when a minor is hurt or unwell. Same text in the waiver, the CGV and the rulebook. */
export const MINOR_EMERGENCY_PROCEDURE =
  'En cas de blessure ou de malaise d’un mineur, les secours de l’événement le prennent en charge, l’organisation prévient dès que possible l’adulte référent puis le représentant légal aux numéros communiqués à l’inscription, et appelle les secours publics (15 ou 112) en cas d’urgence.'

export interface NoticeSection {
  title: string
  items: readonly string[]
}

/** The block shown before signing, and the base of the CGV article 12 summary. */
export const PARTICIPANT_NOTICE: readonly NoticeSection[] = [
  {
    title: 'Les risques que tu prends',
    items: [
      'Une course à obstacles expose à des chutes, entorses, fractures, blessures liées à la chaleur, au froid ou à l’eau, et à des risques graves : invalidité, paralysie, décès.',
      'Ces risques existent même quand le parcours et l’encadrement sont conformes. Tu les acceptes en participant.',
    ],
  },
  {
    title: 'Tes engagements',
    items: [
      HEALTH_PROOF_SENTENCE,
      'Tu as l’âge requis par l’événement (18 ans, ou 16 ans au format OPEN quand l’événement est ouvert aux mineurs) et tu es apte physiquement. Tu n’as pas connaissance d’une contre-indication médicale.',
      'Tu respectes le règlement, le briefing de sécurité et les consignes de l’organisation. En cas de danger, tu t’arrêtes et tu préviens.',
      'Le dossard est personnel : une pièce d’identité est demandée au retrait.',
    ],
  },
  {
    title: 'Si le participant a 16 ou 17 ans',
    items: [
      'Format OPEN uniquement, et seulement si l’événement est ouvert aux mineurs. Le représentant légal signe la décharge, ou donne son accord à la personne qui la signe.',
      'Au retrait du dossard : autorisation parentale signée par le représentant légal et par le mineur, pièce d’identité du mineur, attestation de santé pour mineurs, et présence de l’adulte référent. Sans ces éléments, le départ est refusé et le billet n’est pas remboursé.',
      'Un adulte référent est présent sur le site et joignable pendant toute la participation. Overbound n’assure ni garde ni surveillance du mineur en dehors de l’épreuve.',
      MINOR_EMERGENCY_PROCEDURE,
    ],
  },
  {
    title: 'Ce que l’assurance d’Overbound couvre',
    items: [
      'La responsabilité civile d’Overbound (AXA France IARD) : les dommages causés à des tiers, participants compris, lorsque la cause est imputable à Overbound, dans les limites du contrat.',
      PARTICIPANTS_ARE_THIRD_PARTIES,
    ],
  },
  {
    title: 'Ce qu’elle ne couvre pas',
    items: [
      'Les dommages que tu te causes à toi-même, sans faute d’Overbound : une chute sur un obstacle conforme, par exemple. Frais médicaux, invalidité ou décès restent alors à ta charge.',
    ],
  },
  {
    title: 'Ce qu’on te conseille',
    items: [
      'Souscris une assurance individuelle accident (indemnités en cas de blessure, d’invalidité ou de décès). Ta licence ou ton assurance personnelle l’inclut peut-être : vérifie-le avant le jour J.',
    ],
  },
]

/** Plain-text rendering, for the confirmation email. */
export const PARTICIPANT_NOTICE_PLAIN_TEXT = PARTICIPANT_NOTICE.map(
  (section) => `${section.title}\n${section.items.map((item) => `- ${item}`).join('\n')}`,
).join('\n\n')
