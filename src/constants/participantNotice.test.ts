import { describe, expect, it } from 'vitest'
import {
  HEALTH_PROOF_MINOR_SENTENCE,
  HEALTH_PROOF_SENTENCE,
  MINOR_EMERGENCY_PROCEDURE,
  minorAttestationLabel,
  PARTICIPANT_NOTICE_PLAIN_TEXT,
  PARTICIPANTS_ARE_THIRD_PARTIES,
} from './participantNotice'
import { WAIVER_CLAUSES, WAIVER_PLAIN_TEXT } from './waiver'

describe('participant notice', () => {
  it('asks for the PPS and says the departure is refused without it', () => {
    expect(HEALTH_PROOF_SENTENCE).toMatch(/Pass Prévention Santé/)
    expect(HEALTH_PROOF_SENTENCE).toMatch(/départ est refusé/)
  })

  it('states what the insurance does not cover', () => {
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toMatch(/te causes à toi-même/)
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toMatch(/assurance individuelle accident/)
  })

  it('words the liability between participants as the contract does: third parties, subject to its conditions', () => {
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toContain(PARTICIPANTS_ARE_THIRD_PARTIES)
    expect(WAIVER_PLAIN_TEXT).toContain(PARTICIPANTS_ARE_THIRD_PARTIES)
    expect(PARTICIPANTS_ARE_THIRD_PARTIES).toMatch(/qualité de tiers entre eux/)
    expect(PARTICIPANTS_ARE_THIRD_PARTIES).toMatch(/dans les limites et conditions du contrat/)
  })

  it('never promises cover in every case between participants', () => {
    expect(PARTICIPANTS_ARE_THIRD_PARTIES).toMatch(/ne s’engage pas sur une prise en charge dans tous les cas/)
    expect(WAIVER_PLAIN_TEXT).not.toMatch(/couvre la responsabilité civile des participants/i)
  })

  it('puts the same health proof requirement in the signed waiver', () => {
    expect(WAIVER_PLAIN_TEXT).toContain(HEALTH_PROOF_SENTENCE)
  })
})

describe('participants aged 16 or 17', () => {
  it('asks for the minors health attestation, with a medical certificate when an answer is yes', () => {
    expect(HEALTH_PROOF_MINOR_SENTENCE).toMatch(/questionnaire de santé pour mineurs/)
    expect(HEALTH_PROOF_MINOR_SENTENCE).toMatch(/certificat médical/)
    expect(HEALTH_PROOF_MINOR_SENTENCE).toMatch(/départ est refusé/)
  })

  it('puts the minor rules, their papers and the emergency procedure in the signed waiver', () => {
    expect(WAIVER_PLAIN_TEXT).toContain(HEALTH_PROOF_MINOR_SENTENCE)
    expect(WAIVER_PLAIN_TEXT).toContain(MINOR_EMERGENCY_PROCEDURE)
    expect(WAIVER_PLAIN_TEXT).toMatch(/autorisation parentale/)
    expect(WAIVER_PLAIN_TEXT).toMatch(/adulte référent/)
    expect(WAIVER_PLAIN_TEXT).toMatch(/n’assure ni garde ni surveillance de mineurs/)
  })

  it('no longer tells everyone the edition is for adults only, and keeps RANKED closed to minors', () => {
    expect(WAIVER_PLAIN_TEXT).not.toMatch(/réservée aux personnes majeures/)
    expect(WAIVER_PLAIN_TEXT).toMatch(/ni au format RANKED avant 18 ans/)
  })

  it('does not claim the insurer covers minors, which it has not confirmed in writing', () => {
    expect(WAIVER_PLAIN_TEXT).not.toMatch(/mineur[^.]*(est|sont) couvert/i)
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).not.toMatch(/mineur[^.]*(est|sont) couvert/i)
  })

  it('never makes a minor or a legal representative waive the minor\'s right to sue', () => {
    expect(WAIVER_PLAIN_TEXT).toMatch(/Elle ne s’applique pas non plus à un participant de 16 ou 17 ans/)
    expect(WAIVER_PLAIN_TEXT).toMatch(/à l’exception de la renonciation à recours de la clause 4/)
    expect(WAIVER_PLAIN_TEXT).not.toMatch(/accepte la présente décharge en son nom et pour le compte du mineur/)
  })

  it('keeps the parental authorization until the minor can no longer sue, not one year', () => {
    expect(WAIVER_PLAIN_TEXT).toMatch(/autorisation parentale, avec la présente décharge, jusqu’aux 28 ans/)
    expect(WAIVER_PLAIN_TEXT).not.toMatch(/un an après l’événement/)
  })

  it('words the legal representative attestation for one minor or several, and never waives a right', () => {
    const one = minorAttestationLabel(['Léo'])
    const two = minorAttestationLabel(['Léo', 'Mia'])
    expect(one).toMatch(/représentant légal de Léo, ou agir avec l’accord/)
    expect(two).toMatch(/représentant légal de Léo et Mia, ou agir avec l’accord de leurs représentants légaux/)
    expect(two).toMatch(/Je leur ai expliqué/)
    expect(two).toMatch(/Chacun signera/)
    expect(one).toMatch(/Il signera/)
    expect(one).toMatch(/autorisation parentale papier/)
    expect(one).not.toMatch(/renonc/i)
    expect(two).not.toMatch(/renonc/i)
  })

  it('gives every waiver clause a distinct number', () => {
    const ids = WAIVER_CLAUSES.map((clause) => clause.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tells the notice reader what a minor must bring', () => {
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toMatch(/Si le participant a 16 ou 17 ans/)
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toContain(MINOR_EMERGENCY_PROCEDURE)
  })
})
