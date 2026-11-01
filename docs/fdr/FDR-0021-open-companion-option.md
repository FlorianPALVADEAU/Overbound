# FDR-0021 - Option OPEN (second dossard) sur un billet RANKED

- **Statut** : Accepted
- **Date** : 2026-10-31
- **Owner produit** : Florian Palvadeau
- **Références** : [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md), [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md),
  [FDR-0012](./FDR-0012-user-selected-open-wave.md), [FDR-0013](./FDR-0013-ticket-scoped-departure-waves.md),
  [FDR-0018](./FDR-0018-order-pricing-engine-and-promo-stacking.md), [FDR-0019](./FDR-0019-single-price-and-group-discount.md)

## Décision

Un participant RANKED peut ajouter, pour un prix fixe, un second dossard sur le billet OPEN de
l'événement. C'est un **vrai second `registrations`** : son dossard OPEN, son QR, sa médaille et son
SAS, rattaché au RANKED par `registrations.companion_of`. Ce n'est pas un champ de plus sur le dossard
RANKED (contrairement au billet flexible).

| Sujet | Règle |
|---|---|
| Contrat | `tickets.operations_config.open_companion` sur le billet RANKED : `ticket_id`, `price_cents`, `ranked_max_duration_minutes`, `min_gap_minutes`. Aucune décision par nom de billet. Réglé dans le formulaire admin du billet RANKED (section « Règles opérationnelles », case « Option OPEN »), jamais en SQL. |
| Prix | Fixe (29 € pour l'édition 2026). Jamais remisé : hors codes promo, hors remise groupe, hors `…OPENTICKET`. Il n'entre pas dans la taille du groupe. |
| Départ | SAS OPEN choisi au clic sur l'option. Premier départ autorisé = départ RANKED + durée max + marge (8h00 + 230 min + 20 min = 12h10). SAS trop tôt ou complets grisés avec un message. |
| Groupe | Le compagnon ignore l'ancre de groupe : il ne la fixe pas et n'est pas déplacé par la synchro. |
| Capacité | Pas de plafond propre à l'option. Le compagnon prend une place de l'événement et une place du SAS OPEN choisi. |
| Annulation flexible | Le RANKED et son compagnon sont annulés dans la même transaction. Un seul remboursement : prix RANKED + prix du compagnon. Les frais flexible ne sont pas remboursés. |
| Transfert | Le compagnon suit le RANKED (nouveau QR, nouvelle décharge par dossard). Il ne se transfère pas seul. |
| Points ambassadeur | 0. Le compagnon n'a pas de `promotional_code_id`, que le RPC `award_ambassador_points_for_order` exige. |
| Après paiement | Le compagnon est créé uniquement depuis les métadonnées du PaymentIntent (`companion_participants`, `companion_waves`, `companion_prices`), jamais depuis le corps de la requête. |

## Économie

Coût marginal d'un OPEN en plus : médaille 3 + ravito 3,5 + dossard 2,5 = 9 €, plus Stripe ~1 à 2 €.
Bénévoles : coût fixe, non marginal à ce volume. À 29 €, la marge est d'environ 18 € par option. Avec
100 places RANKED et 15 % de prise, c'est de l'ordre de 270 €. L'option sert d'abord la valeur perçue du
RANKED.

Risque connu : si le format OPEN sature, chaque option prend la place d'un OPEN vendu 60 €. Aucun plafond
n'est posé par choix produit.

## Mise en oeuvre

- Admin : `src/lib/tickets/openCompanionAdmin.ts` (formulaire vers config, validation), `src/app/api/admin/tickets/companionGuard.ts` (refus à l'écriture d'une option qui ne peut pas fonctionner, refus de supprimer le billet OPEN d'une option).
- Domaine : `src/lib/tickets/openCompanion.ts` (contrat, règle d'horaire, offre du checkout, relecture des métadonnées).
- Prix : `computeOrderPricing` (`companion` par participant, `companionTotal`, erreur `COMPANION_UNAVAILABLE`).
- Paiement : `checkCompanionOrder` (`src/lib/checkout/companionEligibility.ts`) avant tout débit.
- Création : `src/app/api/registrations/create/route.ts` (second dossard, bib OPEN, SAS via `assign_selected_wave_to_registration`).
- Cycle de vie : `flexibleRefund.ts`, RPC `cancel_registration_for_flexible_refund`, `claim/route.ts`, `groups/*`.
- UI : `CompanionOption.tsx` dans le formulaire participant.
- Migration : `supabase/migrations/20261031100000_open_companion.sql`, **à appliquer avant de déployer**.

## Légal

CGV : nouvelle sous-partie « Option format OPEN » (article 3) et mention du remboursement conjoint
(article 10). `CGV_VERSION` passe à `2026-10-31`. Les commandes antérieures restent soumises à leur version.
Ce texte n'est pas un conseil juridique : revue d'avocat requise avant mise en ligne (voir `docs/guides/legal.md`),
en particulier pour l'application de l'article 9 aux deux dossards.

## Reste à faire

- Pour chaque nouvelle édition : cocher « Option OPEN » sur le billet RANKED (prix, durée maximale, délai). La liste des billets affiche « Option OPEN » sous le tarif ; son absence sur un RANKED est visible d'un coup d'œil.
- Badge « compagnon » dans la liste admin des participants (le champ `companion_of` est disponible).
- Test de bout en bout du paiement Stripe en mode test, avec et sans l'option.
