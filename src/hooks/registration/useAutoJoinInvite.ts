'use client'

import { useEffect, useRef } from 'react'
import { useJoinGroup, useMyGroup } from '@/app/api/groups/groupQueries'

/**
 * Product decision (2026-11-06): the checkout never shows group UI. A visitor
 * who arrives from an invite link (?invite=CODE) joins that group silently as
 * soon as they are signed in, so the group's departure slot applies to the
 * form without a single extra tap. Everything else about groups lives in the
 * account area.
 *
 * Tried once per code. An invalid or expired link, or a visitor already in a
 * group, is ignored: it must never block the purchase.
 */
export function useAutoJoinInvite(inviteCode: string | null, isSignedIn: boolean) {
  const myGroup = useMyGroup({ enabled: isSignedIn })
  const { mutate } = useJoinGroup()
  const triedCodeRef = useRef<string | null>(null)

  const hasLoadedNoGroup = myGroup.isSuccess && myGroup.data === null

  useEffect(() => {
    if (!inviteCode || !isSignedIn || !hasLoadedNoGroup) return
    if (triedCodeRef.current === inviteCode) return
    triedCodeRef.current = inviteCode
    mutate(inviteCode)
  }, [inviteCode, isSignedIn, hasLoadedNoGroup, mutate])
}
