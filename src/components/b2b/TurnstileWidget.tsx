'use client'

import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      appearance: 'interaction-only'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

const loadTurnstile = () => {
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')))
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile script failed'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface Props {
  onToken: (token: string | null) => void
}

/**
 * Cloudflare Turnstile, invisible unless Cloudflare needs a visible challenge.
 * Renders nothing when no site key is configured (local dev), see the matching server check.
 */
export function TurnstileWidget({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onTokenRef = useRef(onToken)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return
    const container = containerRef.current
    let widgetId: string | null = null
    let cancelled = false

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return
        widgetId = turnstile.render(container, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        })
      })
      .catch(() => onTokenRef.current(null))

    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [])

  if (!SITE_KEY) return null
  return <div ref={containerRef} />
}

export const isTurnstileEnabled = Boolean(SITE_KEY)
