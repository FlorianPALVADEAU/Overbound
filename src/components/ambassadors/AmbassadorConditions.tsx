'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AmbassadorConditions() {
  return (
    <Card id="conditions" className="border-border/60">
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="text-base">Conditions du programme ambassadeur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Les récompenses sont personnelles, non revendables et non convertibles en cash.</p>
        <p>Les points sont attribués uniquement pour des commandes payées.</p>
        <p>Deux codes promo maximum par commande (1 standard + 1 ambassadeur).</p>
        <p>En cas de conflit de codes, la meilleure réduction est conservée et l’utilisateur est informé.</p>
        <p>Tu peux suivre tes points, tes paliers et tes récompenses dans cet espace.</p>
      </CardContent>
    </Card>
  )
}
