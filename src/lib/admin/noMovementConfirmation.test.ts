import { describe, expect, it } from 'vitest'
import { evaluateNoMovementConfirmation, noMovementConfirmationSchema } from './noMovementConfirmation'

const base = {
  commandId: '56e08f7d-24c3-44be-b123-4f034c669909',
  previewId: 'preview-1',
  previewSourceVersion: 'version-1',
  currentSourceVersion: 'version-1',
  policyVariant: 'NO_MOVEMENT' as const,
  reason: 'Correction opérationnelle validée',
  previewExpiresAt: '2026-09-20T10:00:00.000Z',
  eventStartsAt: '2026-09-20T08:00:00.000Z',
  eventTimezone: 'Europe/Paris',
}

describe('noMovementConfirmation', () => {
  it('allows a valid non-financial command before the J-1 cutoff', () => {
    const result = evaluateNoMovementConfirmation(base, new Date('2026-09-18T10:00:00.000Z'))
    expect(result).toEqual({ allowed: true, commandId: base.commandId, policyVariant: 'NO_MOVEMENT' })
  })

  it('blocks an expired or stale preview and the J-1 cutoff', () => {
    const result = evaluateNoMovementConfirmation(
      { ...base, currentSourceVersion: 'version-2', previewExpiresAt: '2026-09-18T09:00:00.000Z' },
      new Date('2026-09-19T10:00:00.000Z'),
    )
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.blockers).toEqual(expect.arrayContaining([
        'L’aperçu a expiré ; il doit être recalculé avant confirmation.',
        'Les données ont changé depuis l’aperçu ; il doit être recalculé.',
        'Aucune correction n’est autorisée à partir de J-1 inclus.',
      ]))
    }
  })

  it('rejects an empty reason at the API boundary', () => {
    expect(noMovementConfirmationSchema.safeParse({ ...base, reason: '   ' }).success).toBe(false)
  })
})
