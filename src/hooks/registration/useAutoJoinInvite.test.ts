import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoJoinInvite } from './useAutoJoinInvite'

const mutate = vi.fn()
let myGroup: { isSuccess: boolean; data: unknown }

vi.mock('@/app/api/groups/groupQueries', () => ({
  useMyGroup: () => myGroup,
  useJoinGroup: () => ({ mutate }),
}))

describe('useAutoJoinInvite', () => {
  beforeEach(() => {
    mutate.mockReset()
    myGroup = { isSuccess: true, data: null }
  })

  it('joins the invited group once the visitor is signed in and has no group', () => {
    const { rerender } = renderHook(() => useAutoJoinInvite('AB12CD34', true))
    rerender()
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith('AB12CD34')
  })

  it('does nothing without an invite code', () => {
    renderHook(() => useAutoJoinInvite(null, true))
    expect(mutate).not.toHaveBeenCalled()
  })

  it('waits for sign-in', () => {
    renderHook(() => useAutoJoinInvite('AB12CD34', false))
    expect(mutate).not.toHaveBeenCalled()
  })

  it('does not join while the group is still loading', () => {
    myGroup = { isSuccess: false, data: undefined }
    renderHook(() => useAutoJoinInvite('AB12CD34', true))
    expect(mutate).not.toHaveBeenCalled()
  })

  it('keeps the visitor in their current group', () => {
    myGroup = { isSuccess: true, data: { id: 'g1' } }
    renderHook(() => useAutoJoinInvite('AB12CD34', true))
    expect(mutate).not.toHaveBeenCalled()
  })
})
