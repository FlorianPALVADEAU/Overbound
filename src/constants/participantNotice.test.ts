import { describe, expect, it } from 'vitest'
import { HEALTH_PROOF_SENTENCE, PARTICIPANT_NOTICE_PLAIN_TEXT } from './participantNotice'
import { WAIVER_PLAIN_TEXT } from './waiver'

describe('participant notice', () => {
  it('asks for the PPS and says the departure is refused without it', () => {
    expect(HEALTH_PROOF_SENTENCE).toMatch(/Pass Prévention Santé/)
    expect(HEALTH_PROOF_SENTENCE).toMatch(/départ est refusé/)
  })

  it('states what the insurance does not cover', () => {
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toMatch(/te causes à toi-même/)
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toMatch(/assurance individuelle accident/)
  })

  it('never claims cover for damage between participants, which the insurer has not confirmed', () => {
    expect(PARTICIPANT_NOTICE_PLAIN_TEXT).toMatch(/ne s’engage pas sur la prise en charge/)
    expect(WAIVER_PLAIN_TEXT).toMatch(/ne s’engage pas sur la prise en charge/)
    expect(WAIVER_PLAIN_TEXT).not.toMatch(/couvre la responsabilité civile des participants/i)
  })

  it('puts the same health proof requirement in the signed waiver', () => {
    expect(WAIVER_PLAIN_TEXT).toContain(HEALTH_PROOF_SENTENCE)
  })
})
