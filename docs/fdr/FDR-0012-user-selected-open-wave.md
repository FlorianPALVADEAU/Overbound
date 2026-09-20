# FDR-0012 — Choix du SAS OPEN par le participant

- **Statut** : Proposed — implémenté de bout en bout (2026-09-19) : RPC, endpoint sélectionnable, wiring create-route, UI participant, hardening chemin groupe. FDR-0004 pas encore mise à jour en Superseded (§6)
- **Date** : 2026-09-18
- **Owner produit** : à désigner
- **Owner technique** : à désigner
- **Périmètre** : remplacement de l'attribution automatique de SAS OPEN par un choix explicite du
  participant, contraint par distance et capacité, personnalisable depuis l'admin
- **Dépendances** : [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md) (superseded en partie par
  cette FDR pour le mode d'assignation OPEN — RANKED inchangé), [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md),
  [FDR-0009](./FDR-0009-maintainability-refactor.md), [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md),
  [FDR-0011](./FDR-0011-fixed-bib-number-assignment.md)

> Cette FDR ne modifie pas le comportement RANKED (départ unique 08h00, aucune notion de SAS). Elle
> remplace uniquement l'algorithme de bin-packing automatique du format OPEN par un choix utilisateur.
> Le dossard (FDR-0011) est indépendant de cette feature — un changement ici ne doit jamais toucher
> `bib_number`.

## 0. Guide de reprise autonome

1. Lire cette FDR, puis [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md) en entier — cette FDR
   ne réécrit pas ce qui reste vrai (configuration des 24 vagues, format detection via
   `isOpenFormatTicket`, structure `event_waves`), elle documente uniquement ce qui change dans le mode
   d'assignation.
2. Lire [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md) — le choix utilisateur ne doit
   jamais s'appliquer à un membre de groupe ancré ; l'ancre prime toujours.
3. Vérifier l'état de `docs/fdr/FDR-0009-maintainability-refactor.md` §1.1/§1.2 avant de coder la RPC
   de sélection — ne pas reproduire une RPC non versionnée ni un chemin groupe non atomique.
4. Ne jamais implémenter l'attribution du SAS choisi en lecture-puis-écriture séparée côté application.
   Le risque de concurrence est identique voire supérieur au bin-packing automatique : plusieurs
   participants sont susceptibles de cibler le même SAS populaire (proche de l'horaire idéal) au même
   moment.
5. `FDR-0004` doit être mise à jour en statut `Superseded` pour la section "OPEN Assignment Workflow"
   une fois cette FDR acceptée et implémentée — ne pas laisser deux documents contradictoires actifs.

## 1. Besoin métier

Le mode actuel (FDR-0004) assigne automatiquement un SAS OPEN via bin-packing, en tenant compte d'une
fenêtre horaire préférée dérivée de la distance idéale du participant. Le produit veut désormais que le
participant **choisisse explicitement** son SAS dans un menu déroulant, cette liste étant :

- **contrainte par la distance minimale et maximale** que le participant renseigne (format OPEN
  uniquement — RANKED n'a pas cette notion) ;
- **personnalisable depuis l'admin** — l'admin doit pouvoir configurer/gérer les SAS proposés (ce qui
  existe déjà largement via [EventOpenWavesSection](../../../src/components/admin/events/EventOpenWavesSection.tsx)
  : capacité, fermeture).

## 2. Décision fonctionnelle

**DECISION** — Le format OPEN passe d'une assignation automatique par bin-packing à un choix explicite
du participant parmi les SAS ouverts et disponibles, filtrés par sa fenêtre de distance. Le format
RANKED n'est pas concerné.

**DECISION** — La contrainte de distance ne calcule plus une fenêtre horaire *recommandée* (comme
aujourd'hui via `getPreferredWindow`/`getLatestAllowed`) mais définit l'ensemble des SAS *sélectionnables*
: seuls les SAS dont l'horaire est compatible avec la distance minimale et maximale déclarées sont
proposés dans le menu déroulant. Un SAS hors de cette fenêtre n'apparaît pas comme option.

**DECISION** — Le membre d'un groupe avec ancre active sur cet événement ne voit pas de choix : son SAS
est imposé par l'ancre du groupe, affiché en lecture seule (comportement FDR-0005 inchangé).

**DECISION Q-1 (à valider par le produit)** — La règle de conversion distance → fenêtre horaire
sélectionnable réutilise-t-elle telle quelle la logique actuelle de `getPreferredWindow`/`getLatestAllowed`
([openSas.ts](../../../src/lib/openSas.ts#L146-L175)), ou le produit veut-il une règle différente
maintenant que c'est un choix contraignant l'utilisateur plutôt qu'une simple préférence pour un
algorithme ? Cette FDR part de l'hypothèse **réutilisation** de la règle existante (déjà validée en
production sur un événement réel) sauf décision contraire explicite.

## 3. Règles métier

### 3.1 Détermination des SAS sélectionnables

Pour un participant avec ticket OPEN, distance minimale `distanceMinKm` et distance idéale/maximale
`distanceIdealKm` (noms de champs existants, [ParticipantForm.tsx](../../../src/components/registration/ParticipantForm.tsx)) :

```
fenêtre_min = getLatestAllowed(eventDate, distanceMinKm)   // borne haute selon distance min
fenêtre_max = getPreferredWindow(eventDate, distanceIdealKm) // borne complète selon distance idéale
```

Un SAS est **sélectionnable** si et seulement si :

1. `event_waves.is_closed = false` ;
2. `event_waves.assigned_count < event_waves.capacity` (place restante) ;
3. `event_waves.start_time` est dans la fenêtre compatible avec les distances déclarées.

Les mêmes seuils que la logique actuelle (`distanceIdeal >= 20` → fenêtre 0-90 min après ouverture,
`>= 10` → 60-150 min, sinon fenêtre complète) sont conservés par défaut selon DECISION Q-1.

### 3.2 Sélection et verrouillage

- Le participant choisit un `wave_index` explicite avant paiement (étape du formulaire d'inscription).
- Au moment de la création de la `registration` (paiement confirmé), le SAS choisi est **revalidé
  côté serveur** — jamais fait confiance à la valeur soumise sans revérifier capacité et fermeture, car
  du temps s'est écoulé entre le choix et le paiement (checkout Stripe).
- Si le SAS choisi n'est plus disponible au moment de la confirmation (concurrence, fermeture admin
  entre-temps), l'inscription **échoue explicitement** avec une erreur actionnable
  (`SELECTED_WAVE_UNAVAILABLE`) — pas de fallback silencieux vers un autre SAS non choisi par
  l'utilisateur.

### 3.3 Groupe ancré (inchangé, rappel)

Si le participant est membre d'un groupe avec ancre active sur cet événement
([FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md)), le choix de SAS est désactivé côté UI
et le SAS de l'ancre est forcé côté serveur, indépendamment de toute valeur soumise par le client.

### 3.4 RANKED (inchangé)

Aucun changement. Pas de SAS, `wave_index`/`wave_position`/`wave_capacity` restent `NULL`, départ unique
08h00.

## 4. Concurrence et intégrité des compteurs

C'est le point le plus sensible de cette FDR : contrairement au bin-packing automatique qui répartit la
charge, un choix utilisateur concentre naturellement la demande sur les créneaux les plus attractifs
(proches de l'horaire idéal). Le risque de double réservation du dernier slot d'un SAS populaire est
plus élevé qu'avec l'algorithme actuel.

**REQUIREMENT** — L'attribution finale doit passer par une RPC avec verrouillage de ligne explicite,
sur le modèle de l'actuelle `assign_open_wave_to_registration` mais paramétrée par le `wave_index` choisi
au lieu de le calculer :

```sql
CREATE FUNCTION assign_selected_wave_to_registration(
  p_event_id uuid,
  p_registration_id uuid,
  p_wave_index integer
) RETURNS json
```

Comportement :

1. Verrouiller la ligne `event_waves` correspondante (`SELECT ... FOR UPDATE`).
2. Vérifier `is_closed = false` et `assigned_count < capacity`.
3. Si indisponible : retourner un échec structuré, ne rien écrire.
4. Si disponible : incrémenter `assigned_count`, écrire `wave_index`/`start_time`/`wave_position` sur
   la `registration`, dans la même transaction.

**Le chemin groupe pré-ancré** (participant déjà membre d'un groupe ancré) continue de contourner ce
choix — voir §3.3 — mais doit lui aussi être migré vers un verrouillage explicite dans le cadre de cette
implémentation, puisque [FDR-0009 §1.2](./FDR-0009-maintainability-refactor.md) documente déjà ce chemin
comme non atomique aujourd'hui. Ne pas livrer cette FDR sans corriger ce point préexistant, car le
nouveau flux de sélection va augmenter la fréquence d'écriture concurrente sur `event_waves`.

## 5. Implémentation

### 5.1 API — liste des SAS sélectionnables

Nouvel endpoint public (pas d'auth requise, appelé pendant le tunnel d'inscription avant paiement) :

```
GET /api/events/:eventId/open-waves/selectable?distanceMinKm=&distanceIdealKm=
```

Réponse : liste des `event_waves` filtrés selon §3.1, avec `remaining = capacity - assigned_count`,
triée par `start_time`. Doit être un appel léger et rapide (le tunnel d'inscription le rappelle à chaque
changement de distance saisie).

### 5.2 API — création de registration

Dans `POST /api/registrations/create` ([route.ts](../../../src/app/api/registrations/create/route.ts)) :

- Le body accepte un nouveau champ `selectedWaveIndex` par participant (schéma Zod
  `participantSchema` à étendre).
- Remplacer l'appel à `assignOpenWaveToRegistration` (bin-packing automatique) par
  `assignSelectedWaveToRegistration` (nouvelle fonction équivalente, appelant la RPC §4) quand
  `selectedWaveIndex` est fourni et que le participant n'est pas dans un groupe pré-ancré.
- Conserver le chemin groupe ancré existant (`openGroupAnchor` déjà présent dans le fichier,
  lignes ~417-449 et ~561-592) sans changement de comportement fonctionnel, seulement le
  durcissement de concurrence demandé en §4.
- Si `selectedWaveIndex` est absent alors que le ticket est OPEN et qu'aucune ancre de groupe ne
  s'applique : erreur de validation explicite (`WAVE_SELECTION_REQUIRED`), pas de fallback vers
  l'ancien bin-packing — sinon les deux modes coexistent silencieusement et deviennent impossibles à
  auditer.

### 5.3 Frontend

- [ParticipantForm.tsx](../../../src/components/registration/ParticipantForm.tsx) : après saisie des
  deux champs distance existants, afficher un `<Select>` peuplé par l'appel à
  `GET /api/events/:eventId/open-waves/selectable`. Désactiver/masquer si membre de groupe ancré
  (afficher le SAS imposé en lecture seule avec message explicite).
- [useParticipants.ts](../../../src/hooks/registration/useParticipants.ts) : ajouter le champ
  `selectedWaveIndex` à l'état participant, invalidé/reréinitialisé si la distance change après un
  premier choix (le SAS choisi peut devenir hors fenêtre).
- Revalidation avant soumission finale : si le SAS choisi affiche `remaining <= 0` au moment du submit
  (donnée rafraîchie), bloquer la soumission côté client avec message clair avant même d'atteindre le
  paiement — mais la revalidation serveur de §3.2 reste la garantie réelle, le client n'est qu'un confort
  UX.

### 5.4 Admin

Aucun nouvel écran requis. [EventOpenWavesSection.tsx](../../../src/components/admin/events/EventOpenWavesSection.tsx)
sert déjà de "menu personnalisable" : capacité par SAS, fermeture d'un SAS (`is_closed`), export CSV,
liste des inscrits par SAS. Vérifier uniquement que fermer un SAS depuis cet écran retire immédiatement
le SAS de la liste sélectionnable côté `GET /api/events/:eventId/open-waves/selectable` (pas de cache
qui retarderait la propagation).

## 6. Impact sur FDR-0004

FDR-0004 documente l'assignation automatique OPEN comme `Accepted (Production)`. Cette FDR la remplace
partiellement. Actions requises sur FDR-0004 une fois FDR-0012 acceptée et implémentée :

- Passer le statut de FDR-0004 à `Superseded (partial — see FDR-0012)` ou ajouter une note en tête de
  document précisant que la section "OPEN Assignment Workflow" ne reflète plus le comportement réel.
- Conserver FDR-0004 pour tout ce qui reste vrai : configuration des 24 vagues, structure `EventWaves`,
  détection de format, comportement RANKED, wave counter maintenance.

## 7. Tests (TDD, succès + échec par use-case)

- Liste des SAS sélectionnables : filtre correctement par distance min/max, exclut fermés et pleins.
- Sélection réussie : SAS choisi disponible → attribution correcte, compteur incrémenté une fois.
- Sélection concurrente sur le dernier slot : deux requêtes simultanées sur le même `wave_index` avec
  `remaining = 1` → une seule réussit, l'autre reçoit `SELECTED_WAVE_UNAVAILABLE` sans écriture
  partielle (test d'intégration avec vraie concurrence, pas mocké séquentiellement).
- SAS fermé entre le choix et le paiement → échec explicite, pas de fallback silencieux.
- Membre de groupe ancré : `selectedWaveIndex` soumis par le client est ignoré, SAS de l'ancre appliqué
  quoi qu'il arrive (test qui soumet volontairement une valeur différente de l'ancre pour vérifier
  qu'elle est ignorée server-side).
- RANKED : aucune régression, toujours pas de SAS, comportement identique à avant cette FDR.
- Chemin groupe pré-ancré durci (§4) : même test de concurrence que documenté dans
  [FDR-0009 §1.2](./FDR-0009-maintainability-refactor.md), à faire passer au vert dans le cadre de
  cette implémentation.

## 8. Critères d'acceptation

- Un participant OPEN voit uniquement des SAS compatibles avec sa distance min/max, ouverts et non
  pleins.
- Aucune double attribution possible sur un SAS proche de sa capacité, prouvé par test de concurrence
  réelle.
- Un membre de groupe ancré ne peut jamais contourner l'ancre via ce nouveau flux.
- RANKED n'est pas affecté.
- Le chemin groupe non atomique préexistant ([FDR-0009 §1.2](./FDR-0009-maintainability-refactor.md))
  est corrigé dans le cadre de cette livraison, pas reporté.
- FDR-0004 mise à jour pour refléter la supersession partielle.
- Tests succès + échec par règle de §7, suite complète passante, `tsc --noEmit` clean.

## 9. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Concentration de la demande sur les SAS les plus attractifs → contention plus forte qu'avec bin-packing | RPC atomique avec verrouillage explicite (§4), testée sous charge concurrente avant activation |
| Front affiche une disponibilité obsolète (cache, latence réseau) et laisse l'utilisateur choisir un SAS déjà plein | Revalidation serveur systématique à la création de registration ; le front n'est qu'un confort, jamais la source de vérité |
| Coexistence temporaire ancien/nouveau mode si migration partielle | Ne pas livrer en feature-flag à double mode sans plan de bascule explicite — activer d'un coup pour un événement donné, pas en continu sur un même événement en cours de vente |
| Confusion opérateur si FDR-0004 reste affichée comme seule source de vérité | Mettre à jour FDR-0004 dans le même lot de livraison, pas en tâche séparée reportée |
