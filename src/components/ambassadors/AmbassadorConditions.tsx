'use client'

import { Disclosure } from '@/components/ds'

export function AmbassadorConditions() {
  return (
    <Disclosure id="conditions" title="Conditions du programme" summary="Récompenses, points, codes promo">
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Les récompenses sont personnelles, non revendables et non convertibles en cash.</li>
        <li>Les points sont attribués uniquement pour des commandes payées.</li>
        <li>Deux codes promo maximum par commande (1 standard + 1 ambassadeur).</li>
        <li>En cas de conflit de codes, la meilleure réduction est conservée et l’utilisateur est informé.</li>
        <li>Tu peux suivre tes points, tes paliers et tes récompenses dans cet espace.</li>
      </ul>
    </Disclosure>
  )
}
