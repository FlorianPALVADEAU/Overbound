'use client'

import { useEffect } from 'react'

const VISIT_KEY = 'overbound-blog-visit-id'

const visitedKey = (slug: string) => `overbound-blog-viewed:${slug}`

/**
 * Envoie une vue par article et par visite. L'identifiant de visite vit dans
 * sessionStorage (un par onglet et par session) : recharger la page ou revenir
 * sur l'article dans le même onglet ne compte pas une seconde fois. Sans
 * sessionStorage disponible, rien n'est envoyé.
 */
export default function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    let visitId: string
    try {
      if (sessionStorage.getItem(visitedKey(slug))) return
      visitId = sessionStorage.getItem(VISIT_KEY) ?? crypto.randomUUID()
      sessionStorage.setItem(VISIT_KEY, visitId)
      sessionStorage.setItem(visitedKey(slug), '1')
    } catch {
      return
    }

    void fetch('/api/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, visitId }),
      keepalive: true,
    }).catch(() => {
      // Un compteur ne doit jamais gêner la lecture.
    })
  }, [slug])

  return null
}
