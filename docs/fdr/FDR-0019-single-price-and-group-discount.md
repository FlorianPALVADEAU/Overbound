# FDR-0019 - Prix unique et remise de groupe

- **Statut** : Accepted (moteur livré, prix en base inchangés)
- **Date** : 2026-10-25
- **Owner produit** : Florian Palvadeau
- **Références** : [FDR-0018](./FDR-0018-order-pricing-engine-and-promo-stacking.md), RETEX de la 1re édition (12 septembre 2026)

## Amendement 2026-11-06 (Florian) : remise par format, plus de mélange

Le palier se compte **par format**, plus sur l'ensemble de la commande. Deux billets OPEN → -10 % sur chacun ; deux billets RANKED → -10 % sur chacun ; un billet OPEN et un billet RANKED → aucune remise. Une commande 2 OPEN + 1 RANKED remise les deux OPEN seulement, le RANKED reste au plein tarif. Chaque format a son propre palier (3 OPEN + 6 RANKED → -15 % sur les OPEN, -20 % sur les RANKED).

Ce qui change : `computeGroupDiscount` renvoie une ligne par format remisé (`lines`), `GroupDiscountResult` n'a plus de `percent` unique, le menu de quantité ne compte que les billets du même format, les textes publics (`/entreprises`, FAQ, devis, blog) disent « par format ». Le principe « la meilleure réduction gagne » ne change pas. Aucun prix en base ne change, pas de migration.

Pas de changement de CGV : le texte ne décrit pas le palier.

## Décision

1. **Prix unique, sans paliers de date.** Open 59,99 €, Ranked 69,99 €. Les paliers (`event_price_tiers`) ne sont plus créés pour les prochaines éditions. Le code des paliers reste en place et sans effet quand aucun palier n'existe.
2. **Remise de groupe automatique, par format** : 2 billets du même format → -10 %, 3 à 5 → -15 %, 6 et plus → -20 %. Les billets Open et Ranked ne se comptent pas ensemble. *Amendements : 2026-10-29 (Florian) la version initiale excluait Ranked ; 2026-11-06 (Florian) le palier mélangé est remplacé par un palier par format, voir ci-dessus.*
3. **Une commande = un paiement.** On compte les billets d'une même commande. Les membres d'un groupe créé par code d'invitation qui paient chacun de leur côté n'ouvrent pas la remise (elle serait rétroactive, donc des remboursements).
4. **Prix figé au paiement.** Si un participant se désiste ensuite, personne n'est remboursé et le palier n'est pas recalculé (politique sans remboursement). Le billet peut être transféré.
5. **Pas de cumul : la meilleure réduction gagne.** Remise de groupe et code promo sur les billets ne s'additionnent pas. Le plus avantageux s'applique, l'égalité va à la remise de groupe.
6. **Le code reste enregistré même quand il perd.** Il reste dans `discounts` à 0 €, donc l'attribution ambassadeur (métadonnées Stripe, points) est conservée. Le récapitulatif indique « Non cumulable ».

Prix effectifs Open à 59,99 € : duo 53,99 €, 3 à 5 → 50,99 €, 6 et plus → 47,99 €. Ranked à 69,99 € : duo 62,99 €, 3 à 5 → 59,49 €, 6 et plus → 55,99 €.

## Implémentation

- `src/lib/orderPricing/groupDiscount.ts` : module pur (`GROUP_DISCOUNT_TIERS`, `groupDiscountPercent`, `computeGroupDiscount`). Arrondi par billet, comme les paliers.
- `computeOrderPricing` compare la remise de groupe à la somme des codes sur billets. Les codes sur option (upsell) ne sont pas touchés. Les prix payés par billet (`paidPriceCents`) portent la remise de groupe sur tous les billets, au même pourcentage.
- `OrderPricing.groupDiscount = { percent, amountCents, applied }`, repris dans `PricingSummary` et affiché par `buildOrderLines`.
- Aucune migration, aucune route modifiée : aperçu navigateur et montant Stripe viennent du même moteur.

## Conséquences et risques

- Les paliers de date, s'il en reste, se cumulent avec la remise de groupe (appliquée sur le prix après palier). Ne plus en créer.
- Un code ambassadeur à 10 % ne change rien au prix d'une commande de 6 billets, mais l'ambassadeur est crédité.
- `award_ambassador_points_for_order` lit `race_format`, aujourd'hui vide en base : à vérifier avant l'édition 2027.
- Ajustements de seuils : modifier `GROUP_DISCOUNT_TIERS` et ses tests uniquement.

## Tests

`groupDiscount.test.ts` (seuils, arrondi, Ranked remisé entre Ranked, formats mélangés sans remise, option flexible non remisée, meilleure réduction, égalité, code upsell), invariants aléatoires du moteur, `orderLines.test.ts`.
