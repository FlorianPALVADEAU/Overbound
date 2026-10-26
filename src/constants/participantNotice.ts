/**
 * What every participant must be told about their commitments, the risks they take and the
 * insurance cover, in one place. The CGV, the waiver, the checkout, the ticket email and the
 * transfer form all read from here, so they cannot drift apart.
 *
 * The insurance wording follows AXA's written answer (Overbound's agency, October 2026): the
 * policy covers damage to third parties, participants included, when Overbound is at fault; it
 * does not cover damage participants cause to themselves. AXA did NOT answer whether damage one
 * participant causes to another is covered, nor whether a transferred bib is covered, nor whether
 * the next edition is: the texts must not claim any of the three.
 *
 * Changing any wording that appears in the waiver requires bumping `REGULATION_VERSION`.
 * Drafted without a lawyer's review (see docs/legal/2026-10-transfer-and-waiver-review.md).
 */

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
      'Tu es majeur(e) et apte physiquement. Tu n’as pas connaissance d’une contre-indication médicale.',
      'Tu respectes le règlement, le briefing de sécurité et les consignes de l’organisation. En cas de danger, tu t’arrêtes et tu préviens.',
      'Le dossard est personnel : une pièce d’identité est demandée au retrait.',
    ],
  },
  {
    title: 'Ce que l’assurance d’Overbound couvre',
    items: [
      'La responsabilité civile d’Overbound (AXA France IARD) : les dommages causés à des tiers, participants compris, lorsque la cause est imputable à Overbound, dans les limites du contrat.',
    ],
  },
  {
    title: 'Ce qu’elle ne couvre pas',
    items: [
      'Les dommages que tu te causes à toi-même, sans faute d’Overbound : une chute sur un obstacle conforme, par exemple. Frais médicaux, invalidité ou décès restent alors à ta charge.',
      'Overbound ne s’engage pas sur la prise en charge, par son contrat, d’un dommage qu’un participant cause à un autre participant sans faute d’Overbound. Vérifie que ta responsabilité civile personnelle (assurance habitation, licence) couvre ce cas.',
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
