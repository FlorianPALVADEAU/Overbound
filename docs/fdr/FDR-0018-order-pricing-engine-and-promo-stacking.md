# FDR-0018 — Moteur de prix unique et cumul des codes promo

- **Statut** : Accepted
- **Date** : 2026-10-12
- **Owner produit** : Florian Palvadeau
- **Périmètre** : calcul du prix d'une commande (paliers, options, codes promo, billet flexible), règle
  de cumul des codes, contrôles avant paiement du tunnel d'inscription
- **Références** : [FDR-0014 addendum](./FDR-0014-addendum-product-line-discounts.md) (codes produit),
  [FDR-0012](./FDR-0012-user-selected-open-wave.md) (SAS choisi), [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md) (ancre de groupe)

## 1. Problème

Le prix d'une commande était calculé à trois endroits : dans le navigateur (`src/lib/registration.ts`),
dans `POST /api/stripe/create-payment-intent` (montant réellement débité) et en partie dans
`POST /api/promotions/validate`. Les trois versions avaient divergé :

- Paliers : le serveur répartit les billets d'une commande entre les paliers selon leurs places
  restantes. Le navigateur appliquait un seul palier à tous les billets. Quand un palier était presque
  plein, le prix affiché n'était donc pas celui débité.
- Code OPENTICKET sans billet OPEN : le serveur refusait la commande, le navigateur affichait une
  remise nulle sans rien dire.
- Cumul : chaque code se calculait sur le sous-total complet. Avec 2 billets à 50 €, un billet OPEN
  offert et un code -50 %, la commande tombait à 0 € au lieu de 25 €.

## 2. Décision

### 2.1 Un seul calcul

`computeOrderPricing` (`src/lib/orderPricing/`) est la seule source de vérité du prix. Fonction pure :
pas de base de données, pas de Stripe, pas de React. Le navigateur et la route de paiement lui donnent
la même entrée (`OrderPricingInput`) et affichent ou débitent sa sortie.

Ajouter une famille de codes promo = ajouter une stratégie dans `src/lib/orderPricing/promo/strategies/`
et l'enregistrer dans `strategies/index.ts`. Le moteur ne change pas.

### 2.2 Règle de cumul : chaque code porte sur ce qui reste à payer

Les codes s'appliquent toujours dans cet ordre, quel que soit l'ordre de saisie :

| Ordre | Famille | Porte sur |
|---|---|---|
| 1 | `…OPENTICKET` | le premier billet OPEN de la commande |
| 2 | `LUOFF30`, `JUOFF50` | les billets ; n'ajoute que ce qui dépasse la remise du palier |
| 3 | Pourcentage | ce qui reste à payer sur les billets |
| 4 | Montant fixe | ce qui reste à payer sur les billets |
| 5 | Code produit | ce qui reste à payer sur son option |

À égalité de famille, les codes s'appliquent par ordre alphabétique, pour que le résultat ne dépende
jamais de l'ordre de saisie.

Exemple : 2 billets OPEN à 50 €, un code `…OPENTICKET` (100 %) et un code ambassadeur -50 %.
Le premier billet est offert (-50 €), puis -50 % sur les 50 € restants (-25 €). Total : **25 €**.

Invariants :

- le billet flexible n'est jamais remisé ;
- une remise ne dépasse jamais ce qu'elle cible ;
- le total n'est jamais négatif ;
- ajouter un code ne fait jamais monter le total.

### 2.3 Combinaisons de codes

Inchangées, mais écrites à un seul endroit (`checkPromoQuota`) : deux codes au plus par commande,
dont un seul code ambassadeur, un seul code billet (deux si l'un est `WELCOME05`) et un seul code
produit.

### 2.4 Contrôles avant tout paiement

Refuser une inscription après le débit Stripe laisse une commande payée sans dossard.
`create-payment-intent` vérifie donc, avant de créer le paiement :

- chaque participant a 18 ans le jour de l'événement ;
- chaque billet à SAS a un SAS choisi, sauf si le groupe a déjà un départ sur l'événement.

## 3. Conséquences

- Les commandes déjà payées ne changent pas de prix. Seules les nouvelles commandes suivent la règle de
  cumul « sur le reste ».
- Le brouillon d'inscription (`RegistrationDraft`) est la seule source des requêtes vers
  `create-payment-intent` et `registrations/create`. Avant cette FDR, la requête d'inscription
  était écrite à la main à deux endroits. Aucune des deux n'envoyait le SAS choisi, et la commande
  gratuite n'envoyait pas le groupe.
- Le récap du tunnel et celui de la page de paiement affichent les mêmes lignes
  (`buildOrderLines`), qui font toujours le total.

## 4. Tests

- `src/lib/orderPricing/computeOrderPricing.test.ts` : commandes calculées à la main (paliers qui
  débordent, cumuls, codes produit, billet flexible, 7 participants mélangés, arrondis).
- `src/lib/orderPricing/computeOrderPricing.invariants.test.ts` : 5 000 commandes générées (graine fixe)
  qui vérifient les invariants du §2.2.
- `src/app/api/stripe/create-payment-intent/route.test.ts` : montant débité, commande gratuite, refus.
- `e2e/checkout.spec.ts` : formulaire incomplet, commande gratuite avec SAS et groupe, mineur refusé,
  sur ordinateur et téléphone.

## 5. Recette réelle (2026-10-12, base de dev, Stripe en mode test)

`e2e/stripe-recipe.spec.ts` rejoue le tunnel sans aucune simulation. Il est désactivé par défaut
(`E2E_STRIPE_RECIPE=1` pour l'activer) parce qu'il crée de vraies commandes. La fixture est dans
`e2e/support/stripe-recipe.fixture.sql`, le nettoyage dans `e2e/support/stripe-recipe.cleanup.sql`.

| # | Cas | Contrôlé en base |
|---|---|---|
| 1 | 1 OPEN payé par carte | 50,00 € débités, dossard, vague 1 |
| 2 | 2 OPEN, billet OPEN offert + ambassadeur -50 % | 25,00 € ; chaque dossard à 12,50 € |
| 3 | carte refusée puis bonne carte | une seule commande et une seule inscription |
| 4 | commande à 100 % avec billet flexible | 8,90 € débités, `flexible_refund = true` |
| 5 | commande gratuite | sans Stripe, inscription créée |
| 6 | palier Early plein au milieu de la commande | 56 € + 56 € + 70 € = 182 € |
| 7 | commande gratuite d'un groupe ancré | placée sur la vague du groupe |

Après chaque scénario, `event_waves.assigned_count` est égal au nombre réel de dossards de la vague
et `promotional_codes.used_count` est exact.

### Défauts révélés par cette recette

La base de dev refuse au rôle `authenticated` la lecture de `registrations` (403), de la jointure
`ambassadors` (403) et de `groups` (500). Le code lisait pourtant ces tables avec la session du
visiteur :

- `create-payment-intent` comptait les places et les paliers avec cette session. Elle ne voit au mieux
  que ses propres inscriptions : la capacité et les paliers n'étaient donc jamais vraiment vérifiés.
  L'ancien code ignorait l'erreur, et la commande passait. Les comptages, les codes promo et le
  groupe sont lus avec le client admin.
- Tout code ambassadeur était refusé (« invalide ou expiré »).
- `registrations/create` vérifiait « cette commande existe-t-elle déjà ? » avec la session : la
  vérification échouait en silence et ne protégeait plus rien. Elle passe sur le client admin et
  échoue explicitement si la lecture rate. Seule la contrainte d'unicité de `orders` rattrapait un
  doublon.
- Le groupe envoyé par le navigateur n'était pas vérifié. Un visiteur pouvait passer l'identifiant
  d'un groupe qui n'est pas le sien pour ne pas choisir de SAS. L'appartenance est maintenant
  contrôlée avant de lire l'ancre.
