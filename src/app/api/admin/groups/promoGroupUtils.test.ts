import { describe, expect, it, vi } from 'vitest'
import { getUserIdsFromPromoRegistrations } from './promoGroupUtils'

const PROMO_ID = '9d1f0c52-3a1b-4c8e-9f6a-0b2d7e4c1a11'
const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

type RpcResult = { data: unknown; error: { message: string } | null }

function adminWithRpc(result: RpcResult) {
  const rpc = vi.fn(async () => result)
  return { admin: { rpc } as unknown as Parameters<typeof getUserIdsFromPromoRegistrations>[0], rpc }
}

describe('getUserIdsFromPromoRegistrations', () => {
  it('reads the registrants with one targeted RPC and never scans Auth', async () => {
    const { admin, rpc } = adminWithRpc({ data: [{ user_id: USER_A }, { user_id: USER_B }], error: null })

    const ids = await getUserIdsFromPromoRegistrations(admin, PROMO_ID)

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('admin_promo_registrant_user_ids', { p_promotional_code_id: PROMO_ID })
    expect(ids).toEqual([USER_A, USER_B])
  })

  it('returns each profile once', async () => {
    const { admin } = adminWithRpc({ data: [{ user_id: USER_A }, { user_id: USER_A }], error: null })

    await expect(getUserIdsFromPromoRegistrations(admin, PROMO_ID)).resolves.toEqual([USER_A])
  })

  it('returns an empty list when nobody registered with the code', async () => {
    const { admin } = adminWithRpc({ data: [], error: null })

    await expect(getUserIdsFromPromoRegistrations(admin, PROMO_ID)).resolves.toEqual([])
  })

  it('throws the database error when the RPC fails', async () => {
    const { admin } = adminWithRpc({ data: null, error: { message: 'permission denied for function' } })

    await expect(getUserIdsFromPromoRegistrations(admin, PROMO_ID)).rejects.toEqual({ message: 'permission denied for function' })
  })

  it('refuses a malformed RPC answer instead of inventing ids', async () => {
    const { admin } = adminWithRpc({ data: [{ user_id: 'not-a-uuid' }], error: null })

    await expect(getUserIdsFromPromoRegistrations(admin, PROMO_ID)).rejects.toThrow('réponse inattendue')
  })
})
