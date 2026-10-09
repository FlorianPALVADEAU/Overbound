import { describe, expect, it, vi } from 'vitest'
import { purgeSafetyDataAfterEvents } from './purgeSafetyData'

const signature = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  signature_data: JSON.stringify({ participant: { firstName: 'Ana', medicalInfo: 'asthme', emergencyContactName: 'Léo', emergencyContactPhone: '06' }, ...extra }),
})

const buildAdmin = (rows: { events: unknown[]; registrations: unknown[]; signatures: unknown[] }) => {
  const updates: Array<{ id: string; data: string }> = []
  const from = vi.fn((table: string) => {
    if (table === 'events') return { select: () => ({ lt: async () => ({ data: rows.events, error: null }) }) }
    if (table === 'registrations') return { select: () => ({ in: async () => ({ data: rows.registrations, error: null }) }) }
    return {
      select: () => ({ in: async () => ({ data: rows.signatures, error: null }) }),
      update: (patch: { signature_data: string }) => ({
        eq: async (_column: string, id: string) => {
          updates.push({ id, data: patch.signature_data })
          return { error: null }
        },
      }),
    }
  })
  return { admin: { from } as never, updates }
}

describe('purgeSafetyDataAfterEvents', () => {
  const now = new Date('2026-11-01T00:00:00Z')

  it('redacts health notes of past events and skips signatures already redacted', async () => {
    const { admin, updates } = buildAdmin({
      events: [{ id: 'e1' }],
      registrations: [{ id: 'r1' }, { id: 'r2' }],
      signatures: [signature('s1'), signature('s2', { safetyDataRedactedAt: '2026-10-01T00:00:00Z' })],
    })

    await expect(purgeSafetyDataAfterEvents(admin, now)).resolves.toEqual({ redacted: 1 })
    expect(updates).toHaveLength(1)
    expect(updates[0]!.id).toBe('s1')
    expect(JSON.parse(updates[0]!.data).participant.medicalInfo).toBe('')
  })

  it('does nothing when no event is old enough', async () => {
    const { admin, updates } = buildAdmin({ events: [], registrations: [], signatures: [] })
    await expect(purgeSafetyDataAfterEvents(admin, now)).resolves.toEqual({ redacted: 0 })
    expect(updates).toHaveLength(0)
  })
})
