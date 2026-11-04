import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, supabaseAdminMock, createSupabaseServerMock, rpcMock, updateSingleMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  createSupabaseServerMock: vi.fn(),
  rpcMock: vi.fn(),
  updateSingleMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock, createSupabaseServer: createSupabaseServerMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: <T,>(handler: T) => handler }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))

import { PUT } from './route'

const RACE_ID = '5c6d7e8f-9012-4345-8678-9abcdef01234'
const OBSTACLE_A = '11111111-2222-4333-8444-555555555555'
const OBSTACLE_B = '66666666-7777-4888-8999-aaaaaaaaaaaa'
const params = { params: Promise.resolve({ id: RACE_ID }) }

const body = {
  name: 'Course test',
  type: 'obstacle',
  difficulty: 5,
  target_public: 'expert',
  distance_km: 8,
  obstacle_ids: [OBSTACLE_A, OBSTACLE_B],
}

const request = () =>
  new Request(`http://localhost/api/admin/races/${RACE_ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as never

/** Race row update chain: update().eq().select().single(). */
const raceChain = () => {
  const chain: Record<string, unknown> = {}
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.single = updateSingleMock
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  updateSingleMock.mockResolvedValue({ data: { id: RACE_ID }, error: null })
  supabaseAdminMock.mockReturnValue({ rpc: rpcMock, from: vi.fn(() => raceChain()) })
  createSupabaseServerMock.mockResolvedValue({ from: vi.fn(() => raceChain()) })
})

describe('PUT /api/admin/races/[id] obstacles', () => {
  it('replaces the obstacle list in one RPC call, in the given order', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })

    await PUT(request(), params)

    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith('admin_set_race_obstacles', {
      p_race_id: RACE_ID,
      p_obstacle_ids: [OBSTACLE_A, OBSTACLE_B],
    })
  })

  it('answers 500 when the obstacle replacement fails, never a 200 on a half-written race', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await PUT(request(), params)

    expect(response.status).toBe(500)
    errorSpy.mockRestore()
  })
})
