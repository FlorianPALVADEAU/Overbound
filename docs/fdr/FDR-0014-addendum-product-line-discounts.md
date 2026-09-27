# FDR-0014 addendum — Remises ciblées sur une ligne produit (PRODUCT_DISCOUNT / PHOTO_DISCOUNT)

- **Statut** : Proposed
- **Date** : 2026-09-26
- **Owner produit** : à désigner
- **Owner technique** : à désigner
- **Périmètre** : extension du moteur de pricing checkout (`src/lib/registration.ts`,
  `src/hooks/registration/useRegistrationPricing.ts`) pour permettre à un code promo de cibler un
  upsell/produit précis au lieu du seul sous-total billet ; extension corrélée du chemin de mint Lucky
  Wheel (`src/lib/luckyWheel/{redemption,spin}.ts`) pour les types `PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT`,
  aujourd'hui désactivés dans l'admin comme mesure conservatoire.
- **Références** : [FDR-0014](./FDR-0014-lucky-wheel.md) (§5 types de récompense, §7 application
  checkout — ce document ne remplace pas §7, il en comble le trou identifié le 2026-09-26),
  [FDR-0009 §7/§8](./FDR-0009-maintainability-refactor.md) (découpage en PR indépendantes, table de
  risques funnel de paiement), [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md) (politique
  financière remises), [docs/audit/AUDIT-2026-09-15-full-codebase-review.md](../audit/AUDIT-2026-09-15-full-codebase-review.md)
  (état réel du schéma `promotional_codes`, non entièrement versionné)
- **Déclencheur** : `PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT` désactivés dans
  `src/components/admin/lucky-wheel/RewardFormDialog.tsx` le 2026-09-26 — les configurer ne mintait
  aucun code (le mint path ne couvre que les deux types billet), un gagnant voyait le nom du lot mais
  ne recevait jamais de code, silencieusement.

> **AVERTISSEMENT — chemin critique du tunnel de paiement.** Toute modification de
> `calculatePromoDiscounts`/`calculatePromoDiscount`/`useRegistrationPricing.ts` touche le calcul du
> montant dû au moment du paiement. La "Definition of Done" de CLAUDE.md (tests pertinents ajoutés et
> passants) s'applique ici sans exception, et la table de risques FDR-0009 §8 est explicite : *"Toucher
> au funnel de paiement introduit une régression sur le taux de conversion"*. Aucune partie de ce plan
> ne doit être mergée sans couverture de test succès **et** échec (voir §2 ci-dessous) — pas de
> "on testera après", le funnel de paiement n'a pas de marge d'erreur silencieuse acceptable.

---

## 0. Constat de l'existant (lecture du code, pas d'hypothèse)

- `calculatePromoDiscount`/`calculatePromoDiscounts` (`src/lib/registration.ts:80-129`) ne prennent en
  paramètre qu'un `ticketSubtotal` unique. Un code promo remise (`discount_percent`/`discount_amount`)
  est systématiquement net contre ce seul sous-total — il n'existe aucune notion de "ce code s'applique
  à l'upsell X". Le seul ciblage existant est celui des codes `OPENTICKET` (net contre le prix du
  premier billet Open trouvé) et des codes `NON_CUMULABLE_WITH_TIER_CODES` (`LUOFF30`, `JUOFF50`, net
  contre l'écart avec le tier tarifaire) — tous les deux ciblent des **billets**, jamais des upsells.
- `useRegistrationPricing.ts` calcule `ticketSubtotal` et `upsellSubtotal` séparément (lignes 32-78),
  mais `discountAmount` (ligne 80-88) n'appelle `calculatePromoDiscounts` qu'avec `ticketSubtotal` —
  `upsellSubtotal` n'est jamais passé en entrée du calcul de remise, seulement utilisé tel quel dans
  `totalDue = ticketSubtotal + upsellSubtotal - discountAmount` (ligne 105-108). Un code remise ne peut
  donc structurellement pas réduire le prix d'un upsell aujourd'hui — même en contournant la validation,
  le calcul de prix ne sait pas où mettre la remise.
- `/api/promotions/validate/route.ts` sélectionne `discount_percent, discount_amount, currency,
  valid_from, valid_until, is_active, usage_limit, used_count, events:promotional_code_events(event_id),
  ambassadors:ambassadors(id)` sur `promotional_codes` — aucune colonne ni relation ne permet de savoir
  qu'un code ne doit s'appliquer qu'à un `upsell_id` précis. `promotional_code_events` est le seul
  pattern de scope existant, et il scope à un **événement**, pas à une ligne produit.
- Le serveur recalcule le prix indépendamment côté paiement
  (`src/app/api/stripe/create-payment-intent/utils.ts` `fetchPromo`, même sélection de colonnes) — donc
  toute extension de schéma doit être reflétée aux **deux** endroits (preview client `useRegistrationPricing`
  et calcul serveur avant `PaymentIntent`), pas seulement côté aperçu.
- `src/lib/luckyWheel/redemption.ts` (`mintLuckyWheelPromoCode`) et `src/lib/luckyWheel/spin.ts`
  (`DISCOUNT_REWARD_TYPES`) ne connaissent que `TICKET_PERCENT_DISCOUNT`/`TICKET_FIXED_DISCOUNT`. Le
  code minté (`promotional_codes` insert, `redemption.ts:120-136`) ne porte aucune référence à un
  upsell — logique, puisque la colonne n'existe pas encore côté schéma `promotional_codes`, et que
  `lucky_wheel_rewards` (migration `20260920190000_lucky_wheel_schema.sql:47-76`) n'a pas non plus de
  colonne de ciblage produit.
- `increment_promo_code_usage`/`markLuckyWheelAllocationRedeemed` (webhook Stripe
  `src/app/api/webhooks/stripe/route.ts:216-231,395`, `registrations/create/route.ts:349-369,721`)
  réconcilient le code promo à la commande finale par `code` (lookup `promotional_codes.id`), jamais par
  ligne de commande — aucun mécanisme actuel ne sait relier un code promo à *quel item* de la commande il
  a réduit. Ce plan doit donc aussi couvrir comment cette information survit jusqu'à la validation
  finale côté Stripe/webhook, pas seulement l'aperçu client.

## 1. Décision de schéma

**DECISION proposée** — Ajouter une colonne nullable `target_upsell_id uuid REFERENCES upsells(id)` sur
`promotional_codes`, **pas** une table de jonction dédiée sur le modèle de `promotional_code_events`.

Justification, par comparaison explicite avec le pattern existant :

- `promotional_code_events` est une table de jonction parce qu'un code promo catalogue peut légitimement
  s'appliquer à **plusieurs** événements simultanément (cardinalité N — c'est d'ailleurs explicitement le
  cas des codes Lucky Wheel actuels, volontairement non scopés à un event, FDR-0014 §7 Q-1). Une jonction
  a du sens là où N > 1 est un besoin réel et déjà démontré par l'usage.
- Un code promo produit-scopé, tel que requis ici, n'a **aucun** cas d'usage produit identifié à ce jour
  pour cibler plusieurs upsells à la fois avec un seul code — la demande (récompense Lucky Wheel
  "20% sur le T-shirt finisher") est structurellement 1 code → 1 upsell. Les codes Lucky Wheel scopés
  produit sont de plus systématiquement `usage_limit = 1` (à usage unique, mintés par allocation
  individuelle, jamais un code catalogue partagé) — il n'y a pas de scénario où le même code doit couvrir
  plusieurs lignes produit différentes pour des utilisateurs différents.
- Une jonction introduirait une ambiguïté qu'une colonne nullable évite structurellement : que faire
  d'un code lié à *plusieurs* `upsell_id` au moment de calculer la remise — l'appliquer à tous ? au
  premier trouvé dans le panier ? Cette question ne se pose pas avec une colonne nullable à un seul FK :
  soit le code cible un upsell précis (`target_upsell_id IS NOT NULL`), soit il reste un code générique
  billet comme aujourd'hui (`target_upsell_id IS NULL`, comportement 100% inchangé).
- Coût de migration : une colonne nullable est rétrocompatible sans backfill (tous les codes existants
  restent `NULL` = comportement legacy inchangé), aligné avec l'observation d'audit que le schéma
  `promotional_codes` vit déjà en partie hors migrations versionnées — ce plan **doit** livrer cette
  colonne dans une migration versionnée dans `supabase/migrations/`, pas en ajout direct via le dashboard
  Supabase (répéter la même erreur que celle notée dans `AUDIT-2026-09-15` serait aggraver, pas corriger,
  la dette déjà documentée).

**Si le produit change d'avis plus tard** (un code produit-scopé doit un jour couvrir plusieurs upsells,
ex. "20% sur tout accessoire photo"), le chemin de migration est direct : ajouter
`promotional_code_upsells (promotional_code_id, upsell_id)` en plus de la colonne, sans la retirer
(`target_upsell_id` devient alors le cas particulier N=1, la jonction couvre N>1) — mais ce plan
recommande explicitement de **ne pas** construire cette généralité par anticipation tant qu'aucun besoin
concret ne l'exige (l'unique appelant connu à ce jour, Lucky Wheel, est structurellement 1:1).

### DDL proposé

```sql
ALTER TABLE public.promotional_codes
  ADD COLUMN target_upsell_id uuid REFERENCES public.upsells(id);

CREATE INDEX IF NOT EXISTS idx_promotional_codes_target_upsell_id
  ON public.promotional_codes(target_upsell_id)
  WHERE target_upsell_id IS NOT NULL;

COMMENT ON COLUMN public.promotional_codes.target_upsell_id IS
  'Nullable. NULL = code générique appliqué au sous-total billet (comportement historique).
   Non-null = code scopé à un upsell précis, net uniquement contre son sous-total ; ne doit
   jamais discounter le billet si cet upsell n''est pas sélectionné (voir FDR-0014 addendum §2).';
```

Cette migration doit être committée dans `supabase/migrations/` dès l'écriture, conformément au
précédent explicitement rappelé par FDR-0014 §0.3/§3 (RPC/schéma jamais créés en base puis
rétro-documentés).

## 2. Changement du moteur de pricing

### 2.1 `calculatePromoDiscount`/`calculatePromoDiscounts` (`src/lib/registration.ts`)

Aujourd'hui : `calculatePromoDiscount(promo, ticketSubtotal, options)` — un seul sous-total en entrée.

**Changement requis** — la fonction doit connaître, pour chaque code appliqué, quel sous-total est la
bonne cible :

- Si `promo.target_upsell_id` est `null`/absent : comportement **strictement inchangé** — net contre
  `ticketSubtotal` (ou le sous-total spécial `OPENTICKET`/tier existant), aucune régression sur les
  codes existants.
- Si `promo.target_upsell_id` est renseigné : le code doit être net contre le sous-total de **cet
  upsell précis** dans le panier courant (`quantity * upsell.price_cents` pour cet `upsell_id`, pas
  `upsellSubtotal` global qui agrège tous les upsells sélectionnés) — jamais contre `ticketSubtotal`.
- **Cas requis explicitement par le brief : l'upsell ciblé n'est pas sélectionné par le participant,
  mais existe bien au catalogue de l'événement acheté.** Le code est présent (saisi, validé par
  `/api/promotions/validate`, accepté puisque l'upsell est bien vendu sur cet événement) mais
  inapplicable faute d'être dans le panier. Le comportement correct est : remise nette = 0 pour ce
  code, **jamais** un repli silencieux vers le sous-total billet ou vers un autre upsell. C'est le bug
  qu'il faut activement empêcher, pas seulement ne pas introduire — sans changement de signature, la
  fonction actuelle n'a aucun moyen de distinguer "upsell non sélectionné" de "pas de remise à
  appliquer", donc ce cas doit être un chemin de code explicite, testé, pas une conséquence accidentelle
  du typage.
  **Distinct** (décision produit, §6) du cas où l'upsell ciblé **n'existe pas du tout** au catalogue de
  l'événement acheté : ce second cas est rejeté plus tôt, à la validation du code
  (`/api/promotions/validate` retourne une erreur explicite), pas silencieusement ramené à 0 ici dans
  le calcul de prix — voir §6 pour la distinction complète des deux cas.

Changement de signature proposé (illustratif, pas prescriptif au caractère près — à affiner en
implémentation) :

```ts
type PromoDiscountOptions = {
  tierDiscountAmount?: number
  baseTicketSubtotal?: number
  firstOpenTicketPrice?: number
  // Nouveau : sous-totaux par upsell sélectionné, nécessaire pour nettoyer un
  // code target_upsell_id contre la bonne ligne sans toucher au ticketSubtotal.
  upsellSubtotalsById?: Record<string, number>
}

// calculatePromoDiscount doit désormais recevoir promo.target_upsell_id (déjà porté par
// AppliedPromo si le type est étendu en conséquence, voir ci-dessous) et renvoyer 0 explicitement
// quand target_upsell_id est renseigné mais absent de upsellSubtotalsById (upsell non sélectionné).
```

`AppliedPromo` (`src/components/registration/types.ts`) doit gagner un champ `target_upsell_id?:
string | null`, propagé depuis la réponse `/api/promotions/validate` (qui doit lui-même sélectionner
la nouvelle colonne et la renvoyer dans le payload `promotionalCode`).

### 2.2 `useRegistrationPricing.ts`

- `discountAmount` (ligne 80-88) doit être calculé avec un sous-total par upsell disponible en entrée
  (dérivable de la boucle qui calcule déjà `upsellSubtotal`, ligne 72-78 — il suffit de conserver la
  map intermédiaire par `upsellId` au lieu de ne garder que le total agrégé).
- `totalDue` (ligne 105-108) reste `ticketSubtotal + upsellSubtotal - discountAmount` **si**
  `discountAmount` reste une somme unique nette contre le total combiné — ce qui est correct
  mathématiquement (une remise nette contre l'upsell réduit bien le total dû), à condition que
  `calculatePromoDiscounts` ne dépasse jamais le sous-total de l'upsell ciblé (borne haute déjà présente
  dans le pattern `Math.min(subtotal, ...)` de `calculateDiscountForSubtotal`, à répliquer pour le
  sous-total upsell).
- Il est recommandé d'exposer aussi, en plus de `discountAmount` global, une décomposition
  (`discountAmount` par cible : billet vs upsell) pour l'affichage récapitulatif de commande (l'UI de
  résumé doit pouvoir dire "20% sur T-shirt finisher : -3,00€" plutôt qu'une seule ligne de remise
  opaque) — hors scope strict du calcul de prix mais nécessaire pour ne pas livrer une remise invisible
  à l'utilisateur.

### 2.3 Calcul serveur (parité obligatoire)

`src/app/api/stripe/create-payment-intent/utils.ts` (`fetchPromo`) et tout autre endroit qui
recalcule le prix côté serveur avant la création du `PaymentIntent` doivent appliquer **exactement** la
même logique que §2.1/§2.2, avec la même colonne `target_upsell_id`. Un écart entre preview client et
calcul serveur sur une remise produit-scopée est le scénario même que FDR-0010 encadre déjà pour les
écarts financiers billet — mais ici il s'agit d'un écart évitable dès la conception, pas d'un écart
catalogue accepté. `calculatePromoDiscounts` doit rester la fonction unique appelée des deux côtés
(pas de duplication de la logique de ciblage upsell côté route API) pour garantir cette parité par
construction plutôt que par discipline de synchronisation manuelle.

### 2.4 Exigence de tests (non négociable, cf. avertissement en tête de document)

Avant tout merge touchant `calculatePromoDiscounts`/`useRegistrationPricing.ts` :

- **Succès** : un code `target_upsell_id = X` appliqué avec l'upsell X sélectionné en quantité ≥ 1 nette
  correctement contre le sous-total de X uniquement ; `ticketSubtotal` et tout autre upsell du panier
  restent inchangés dans `totalDue`.
- **Échec (le cas prioritaire du brief)** : un code `target_upsell_id = X` appliqué **sans** que
  l'upsell X soit sélectionné → `discountAmount` pour ce code = 0, `ticketSubtotal` inchangé,
  `totalDue` inchangé par rapport à un panier sans ce code. Test explicite qui échouerait si la
  fonction retombait par erreur sur le comportement par défaut (net contre `ticketSubtotal`).
- **Non-régression** : toute la suite existante de `calculatePromoDiscount`/`calculatePromoDiscounts`
  (`OPENTICKET`, `NON_CUMULABLE_WITH_TIER_CODES`, codes génériques) doit rester verte sans modification
  de leurs assertions — `target_upsell_id IS NULL` est le chemin par défaut, il ne doit strictement
  rien changer pour ces cas.
- **Parité client/serveur** : au moins un test d'intégration qui vérifie que le montant calculé côté
  `useRegistrationPricing` et celui recalculé côté `create-payment-intent` concordent pour un panier
  avec code produit-scopé.

## 3. Extension du mint path Lucky Wheel

### 3.1 `lucky_wheel_rewards` — nouvelle colonne de ciblage

`PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT` n'ont aujourd'hui **aucun** champ indiquant quel upsell est
concerné — ni dans le modèle FDR-0014 §5 (`WheelReward`), ni dans la table `lucky_wheel_rewards`
(migration `20260920190000_lucky_wheel_schema.sql`). Une campagne peut cibler plusieurs événements
(Q-1, FDR-0014 §2), et différents événements peuvent avoir des upsells différents (T-shirt finisher
d'un événement n'est pas forcément le même produit — ni le même `id` — qu'un autre) : une récompense ne
peut donc pas coder en dur "l'upsell T-shirt" sans savoir dans quel événement la commande finale aura
lieu.

**DECISION proposée** — Ajouter `target_upsell_id uuid REFERENCES upsells(id)` (nullable) sur
`lucky_wheel_rewards`, configuré par l'admin à la création/édition de la récompense, avec la contrainte
applicative suivante : l'upsell choisi doit être actif pour **au moins un** des événements liés à la
campagne (`lucky_wheel_campaign_events`) au moment de la sauvegarde — sinon la récompense serait
définie sur un produit qui n'existe nulle part où elle peut être gagnée. Cette validation se fait côté
route admin (`src/app/api/admin/lucky-wheel/rewards/route.ts` et `[id]/route.ts`), pas en contrainte
SQL déclarative (un upsell peut être `event_id IS NULL`, c'est-à-dire global à tous les événements —
la validation doit couvrir ce cas comme valide aussi).

```sql
ALTER TABLE public.lucky_wheel_rewards
  ADD COLUMN target_upsell_id uuid REFERENCES public.upsells(id);

COMMENT ON COLUMN public.lucky_wheel_rewards.target_upsell_id IS
  'Requis pour PRODUCT_DISCOUNT/PHOTO_DISCOUNT (validé applicativement, pas en CHECK SQL car
   dépend du type). NULL pour tout autre type de récompense.';
```

**Question ouverte non tranchée ici** (voir §6) : que se passe-t-il si l'admin choisit un upsell qui
n'est vendu que sur *certains* des événements liés à la campagne, pas tous ? Le code minté doit-il être
implicitement restreint à ces événements (contrairement à la décision Q-1 actuelle de ne jamais scoper
par événement), ou reste-t-il valide partout et silencieusement inapplicable sur les événements où
l'upsell n'existe pas (auquel cas §2.1 doit renvoyer 0, jamais une remise billet de repli) ?

### 3.2 `mintLuckyWheelPromoCode` (`src/lib/luckyWheel/redemption.ts`)

- `DISCOUNT_REWARD_TYPES` (ligne 29 de `redemption.ts`, dupliqué ligne 28 de `spin.ts`) doit inclure
  `PRODUCT_DISCOUNT` et `PHOTO_DISCOUNT`.
- L'insert `promotional_codes` (ligne 120-136) doit porter `target_upsell_id: reward.target_upsell_id`
  en plus des champs déjà présents (`discount_percent`/`discount_amount` selon que `PRODUCT_DISCOUNT`/
  `PHOTO_DISCOUNT` sont interprétés en pourcentage ou montant fixe — le modèle actuel `WheelReward`
  n'a qu'un seul champ `public_value`/`value` sans distinction explicite pourcentage/montant pour ces
  deux nouveaux types ; à trancher en même temps que le schéma de reward, probablement par le même
  mécanisme que `TICKET_PERCENT_DISCOUNT` vs `TICKET_FIXED_DISCOUNT`, c'est-à-dire deux types distincts
  plutôt qu'un flag — mais `PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT` existent aujourd'hui comme deux types
  uniques sans variante fixe/pourcentage, donc ce point doit être clarifié avant l'implémentation,
  voir §6).
- Le `select` qui charge l'allocation (ligne 76-83) doit inclure `reward:lucky_wheel_rewards(...,
  target_upsell_id)` pour transporter la valeur jusqu'à l'insert.
- Aucun autre changement de flux : le code reste minté synchrone au moment du tirage (pas au checkout),
  affiché et emailé immédiatement, saisi manuellement — l'intégralité de la décision §7 de FDR-0014
  (abandon de l'auto-apply) s'applique identiquement aux codes produit-scopés, ce plan ne la remet pas
  en cause.

### 3.3 `spinLuckyWheel` (`src/lib/luckyWheel/spin.ts`)

Changement mécanique : `DISCOUNT_REWARD_TYPES` étendu (voir §3.2) suffit à faire passer
`PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT` par le même chemin de mint que les types billet — aucune autre
logique de `spin.ts` n'a besoin de connaître l'upsell ciblé, cette information ne sert qu'au moment du
mint et de la validation checkout.

## 4. FREE_PRODUCT / FREE_PHOTO_PACK — état actuel, hors scope de ce fix

Vérifié dans le code, pas supposé : `DISCOUNT_REWARD_TYPES` dans `spin.ts` et `redemption.ts` ne
contient que les types remise. Pour `FREE_PRODUCT`/`FREE_PHOTO_PACK`, `spin.ts` (ligne 92-101) ne les
inclut jamais dans la branche de mint — `promoCode` reste `null` pour ces types
(`spin.ts:18` commentaire : *"null for reward types with no checkout-side effect (FREE_PRODUCT,
etc.)"*, répété côté hook `use-lucky-wheel-spin.ts:17-18`). Confirmé : **il n'y a littéralement aucun
effet côté checkout aujourd'hui** pour ces deux types — pas un bug caché, un no-op documenté et
assumé. Le gagnant voit le nom du lot sur l'écran de résultat et dans l'email, mais rien ne réduit son
panier ni ne débloque quoi que ce soit d'automatisé ; la distribution (patch physique, pack photo)
semble supposée être un process manuel/logistique hors produit digital, non tracée dans ce code.

C'est un gap **différent** de celui traité ici : `PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT` sont des remises
qui doivent réduire un prix (gap de moteur de pricing, ce document) ; `FREE_PRODUCT`/`FREE_PHOTO_PACK`
sont des lots physiques/services qui ne passent pas du tout par le panier (gap de fulfillment, pas de
pricing). Les deux gaps ne se résolvent pas par le même mécanisme — noté ici pour complétude comme
demandé, mais explicitement **hors scope** de l'implémentation proposée en §1-3. Si le produit veut
un jour un "20% sur le pack photo" qui *est* un vrai discount (`PHOTO_DISCOUNT`) c'est couvert par ce
plan ; un "pack photo gratuit livré automatiquement" (`FREE_PHOTO_PACK`) ne l'est pas et reste un chantier
séparé à documenter ailleurs s'il devient prioritaire.

## 5. Séquencement par PR indépendantes

Convention reprise de FDR-0009 §7 (*"chaque section traitée comme une série de PR indépendantes"*) —
chaque étape ci-dessous est mergeable, testée et sans régression seule, sans dépendre du merge de
l'étape suivante pour rester stable en production :

1. **Migration schéma** — `target_upsell_id` sur `promotional_codes` (§1) et sur `lucky_wheel_rewards`
   (§3.1). Colonnes nullables, aucun comportement applicatif ne change tant que rien ne les renseigne.
   Testable seul : migration applique/rollback proprement, `tsc --noEmit` clean, aucune régression sur
   les routes existantes qui font `select('*')` ou une liste de colonnes explicite sur ces deux tables
   (vérifier chaque call site recensé en §0 n'échoue pas sur la colonne additionnelle).
2. **Moteur de pricing** — `calculatePromoDiscounts`/`calculatePromoDiscount`/
   `useRegistrationPricing.ts` + parité serveur (§2). Testable seul avec des codes promo
   `target_upsell_id` créés manuellement en base (sans passer par Lucky Wheel) — découple la preuve que
   le moteur de pricing est correct de la preuve que le mint Lucky Wheel l'est. **Cette étape porte le
   risque funnel de paiement le plus élevé du plan** ; ne pas la fusionner avec l'étape 3 ou 4 dans la
   même PR, pour garder une revue et un rollback isolés.
3. **Mint path Lucky Wheel** — `DISCOUNT_REWARD_TYPES` étendu, `mintLuckyWheelPromoCode` porte
   `target_upsell_id` (§3.2-3.3). Dépend fonctionnellement de l'étape 2 (sans elle, le code minté existe
   mais ne réduirait toujours rien) mais reste une PR distincte, reviewable séparément : le risque ici
   est côté génération de code, pas côté calcul de prix.
4. **Réactivation admin UI** — retrait de `disabled: true` sur `PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT` dans
   `RewardFormDialog.tsx`, ajout du champ de sélection `target_upsell_id` au formulaire. **Dernière
   étape seulement**, après QA manuelle bout-en-bout sur une commande de staging (voir §6 pour la
   question ouverte sur le timing exact) — réactiver le dropdown avant que 1-3 soient en production
   reproduirait exactement le problème qui a motivé la désactivation du 2026-09-26.

## 6. Décisions produit (arbitrées 2026-09-26) et question restante

Réponses de l'owner produit aux points soulevés dans la version précédente de cette section :

- **Cumul avec un code tier billet — TRANCHÉ.** Un code billet et un code produit peuvent coexister
  dans la même commande. La règle de cumul n'est pas "1 code Lucky Wheel non cumulable avec tout autre
  code" (ce que FDR-0014 §7 disait pour `LWHEEL-*` billet) mais, plus précisément : jamais deux codes
  de la même cible dans la même commande — jamais 2 codes billet, jamais 2 codes produit. 1 code billet
  + 1 code produit est le cas nominal autorisé. Ceci remplace la note FDR-0014 §7 "traiter les codes
  Lucky Wheel comme non cumulables avec tout autre code promo par défaut" pour le cas billet+produit —
  cette note reste valable seulement pour deux codes visant la même cible.
- **Quota des 2 codes (`/api/promotions/validate`) — TRANCHÉ, découle du point précédent.** La règle
  "2 codes max, dont 1 seul standard non-ambassadeur" (route `validate`, lignes 132-183) doit devenir
  par cible plutôt que globale : max 1 code billet + max 1 code produit-scopé, pas "2 codes total peu
  importe la cible". Implémentation : la vérification de doublon/quota dans `/api/promotions/validate`
  doit distinguer `target_upsell_id IS NULL` (billet) de `target_upsell_id IS NOT NULL` (produit) et
  appliquer la limite d'1 séparément à chaque groupe, au lieu du compteur unique actuel. À couvrir par
  un test dédié (ajouté aux critères d'acceptation §7 ci-dessous).
- **PRODUCT_DISCOUNT/PHOTO_DISCOUNT : pourcentage ou montant — TRANCHÉ.** Une seule variante suffit,
  pas de split en deux types comme pour les billets. `lucky_wheel_rewards.target_upsell_id` (§3.1) n'a
  donc pas besoin d'un flag `is_percent` additionnel au-delà de ce qui existe déjà côté modèle de
  reward — à confirmer en implémentation quelle unité (pourcentage vs montant fixe) `PRODUCT_DISCOUNT`/
  `PHOTO_DISCOUNT` portent aujourd'hui via `public_value`, et garder cette unique interprétation.
- **Upsell disponible sur certains événements de la campagne seulement — TRANCHÉ.** Le code reste
  valide partout (pas de réintroduction de scope événement, Q-1 inchangée) mais rejeté avec un message
  explicite si le produit ciblé n'est pas vendu sur l'événement acheté — jamais un fallback silencieux
  vers une remise billet. Ceci précise §2.1 en distinguant deux cas :
  - **Upsell non sélectionné** (le participant avait le choix mais ne l'a pas pris) : remise = 0,
    silencieusement, dans le calcul de prix — pas d'erreur, il n'y a juste rien à réduire.
  - **Upsell absent du catalogue de cet événement** (le choix n'existe même pas pour cet événement) :
    message d'erreur visible au moment de la validation du code, du type *"Ce code n'est pas applicable
    pour cet événement, aucun produit éligible"* — pas un succès silencieux avec remise nulle. À
    implémenter dans `/api/promotions/validate` : vérifier que `target_upsell_id` fait partie des
    upsells actifs de l'`eventId` demandé, sinon retourner une erreur explicite plutôt qu'un succès.
- **Timing de réactivation de l'admin UI (étape 4) — TRANCHÉ.** Après la QA/tests des étapes 1-3 (§5),
  confirmé — pas de réactivation anticipée groupée avec le moteur de pricing.

**Question restante, non tranchée** :

- **Affichage de la remise produit-scopée dans le récapitulatif de commande.** §2.2 note le besoin
  d'une décomposition par cible pour l'UI, mais la maquette/comportement exact (ligne dédiée ? badge
  sur la ligne upsell concernée ?) n'est pas définie ici — dépend de décisions UX hors du périmètre
  pricing de ce document. À trancher au moment de l'implémentation de l'étape 2, pas bloquant pour
  démarrer l'étape 1 (migration schéma).

## 7. Critères d'acceptation

- Migration `target_upsell_id` (les deux tables, §1 et §3.1) versionnée dans `supabase/migrations/`
  avant tout code applicatif qui la référence.
- `calculatePromoDiscounts`/`calculatePromoDiscount` : un code `target_upsell_id` net correctement
  contre le sous-total du bon upsell ; un code `target_upsell_id` sans l'upsell sélectionné renvoie 0
  sans affecter `ticketSubtotal` — les deux prouvés par test, pas par inspection visuelle.
- Parité stricte entre le calcul client (`useRegistrationPricing`) et le calcul serveur
  (`create-payment-intent`) pour un panier avec code produit-scopé, prouvée par test d'intégration.
- Aucune régression sur la suite de tests existante de `calculatePromoDiscount`/`calculatePromoDiscounts`
  (codes `OPENTICKET`, `NON_CUMULABLE_WITH_TIER_CODES`, codes génériques).
- `/api/promotions/validate` : quota par cible (§6) — un code billet + un code produit acceptés
  ensemble ; deux codes billet ou deux codes produit refusés, prouvé par test (remplace/étend les
  tests actuels de quota "2 codes max, 1 seul standard").
- `/api/promotions/validate` : un code `target_upsell_id` dont l'upsell n'est pas vendu sur
  l'`eventId` demandé retourne une erreur explicite ("non applicable pour cet événement, aucun produit
  éligible"), jamais un succès avec remise nulle — distinct du cas "upsell simplement non sélectionné
  dans le panier" (§2.1/§6), qui reste un succès avec remise = 0. Les deux comportements prouvés par
  test séparés.
- `mintLuckyWheelPromoCode` mint un code `target_upsell_id` correctement rempli pour
  `PRODUCT_DISCOUNT`/`PHOTO_DISCOUNT`, réutilisant la même idempotence que les types billet existants.
- Réactivation admin (`RewardFormDialog.tsx`) seulement après que les étapes 1-3 (§5) sont en
  production et validées par QA manuelle sur staging — pas de retrait de `disabled: true` en même temps
  que le reste du plan.
- `tsc --noEmit` clean, suite de tests complète passante, à chaque étape du séquencement §5
  indépendamment.

## 8. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Régression sur le calcul de prix du funnel d'achat (tout code promo, pas seulement produit-scopé) | Tests succès + échec obligatoires avant merge de l'étape 2 (§2.4/§5) ; aucune PR de moteur de pricing sans cette couverture, conformément à CLAUDE.md Definition of Done et FDR-0009 §8 |
| Code produit-scopé présent mais upsell non sélectionné retombe silencieusement sur une remise billet | Chemin de code explicite testé en échec (§2.1/§2.4) — le comportement par défaut (`target_upsell_id NULL`) ne doit jamais être le fallback implicite d'un code scopé inapplicable |
| Écart entre calcul client (preview) et calcul serveur (PaymentIntent) sur un panier avec code produit-scopé | `calculatePromoDiscounts` reste la fonction unique appelée des deux côtés (§2.3), test de parité explicite |
| Admin réactive le dropdown avant que le moteur de pricing sache appliquer le ciblage | Séquencement §5 : réactivation UI strictement après étapes 1-3 en production + QA staging |
| Récompense `target_upsell_id` configurée sur un upsell absent de tous les événements de la campagne | Validation applicative côté route admin à la sauvegarde de la récompense (§3.1) |
| Changement du quota "2 codes max" en quota "1 par cible" (§6) casse silencieusement un cas existant (ex. deux codes billet légitimement refusés aujourd'hui se comportent différemment après coup) | Tests de non-régression explicites sur la suite `/api/promotions/validate` existante avant/après le changement de logique de quota (§7), pas seulement des tests nouveaux pour le cas produit |
| Reproduire la dette FDR-0009 §1.1/§3 (schéma/RPC non versionné) sur les nouvelles colonnes | Migration committée dans `supabase/migrations/` dès le premier commit, jamais ajoutée directement en base (§1, §5 étape 1) |
