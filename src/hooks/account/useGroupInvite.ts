'use client'

import { useCallback, useEffect, useState } from 'react'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { buildInviteMessage, buildInviteUrl } from '@/lib/groups/invite'
import type { Group } from '@/types/Group'

const COPIED_MS = 2000

/** Invite flow of a group: native share (WhatsApp, SMS…) with clipboard fallback, plus plain code copy. */
export function useGroupInvite(group: Pick<Group, 'name' | 'invite_code'>) {
  const { data: featured } = useFeaturedEvent()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(timeout)
  }, [copied])

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => undefined)
    setCopied(true)
  }, [])

  const invite = useCallback(async () => {
    // Friends are usually not registered yet: send them to the registration page with the code pre-filled.
    const event = featured?.event
    const link = event
      ? buildInviteUrl(window.location.origin, event.slug, group.invite_code)
      : `${window.location.origin}/account/group?join=${encodeURIComponent(group.invite_code)}`
    const message = event ? buildInviteMessage(event.title, link) : `Rejoins mon groupe « ${group.name} » sur Overbound : ${link}`

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: message })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    await copy(message)
  }, [copy, featured?.event, group.invite_code, group.name])

  const copyCode = useCallback(() => copy(group.invite_code), [copy, group.invite_code])

  return { invite, copyCode, copied }
}
