import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/email', () => ({ sendTransferHandedOverEmail: vi.fn(), sendTransferReceivedEmail: vi.fn() }))

import { redactFormerHolderWaiver } from './transferAftermath'

const buildAdmin = (rows: unknown[], selectError: unknown = null) => {
  const updates: Array<{ id: string; data: string }> = []
  const filters: Array<[string, string]> = []
  const selectChain = {
    eq: (column: string, value: string) => {
      filters.push([column, value])
      return filters.length >= 2 ? Promise.resolve({ data: rows, error: selectError }) : selectChain
    },
  }
  const admin = {
    from: () => ({
      select: () => selectChain,
      update: (patch: { signature_data: string }) => ({
        eq: async (_column: string, id: string) => {
          updates.push({ id, data: patch.signature_data })
          return { error: null }
        },
      }),
    }),
  }
  return { admin: admin as never, updates, filters }
}

describe('redactFormerHolderWaiver', () => {
  const now = new Date('2026-10-09T10:00:00Z')

  it('erases the former holder health notes on their purchase waiver only', async () => {
    const { admin, updates, filters } = buildAdmin([
      { id: 's1', signature_data: JSON.stringify({ participant: { firstName: 'Ana', medicalInfo: 'asthme', emergencyContactPhone: '06' } }) },
    ])
    await redactFormerHolderWaiver(admin, 'reg-1', now)
    expect(filters).toEqual([['registration_id', 'reg-1'], ['context', 'purchase']])
    expect(updates).toHaveLength(1)
    expect(JSON.parse(updates[0]!.data).participant).toMatchObject({ firstName: 'Ana', medicalInfo: '', emergencyContactPhone: '' })
  })

  it('propagates a read failure so the caller can log it', async () => {
    const { admin } = buildAdmin([], new Error('db down'))
    await expect(redactFormerHolderWaiver(admin, 'reg-1', now)).rejects.toThrow('db down')
  })
})
