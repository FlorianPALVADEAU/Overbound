# FDR-0011 — Attribution de numéro de dossard fixe à l'inscription

- **Statut** : Proposed — schéma + RPC + attribution atomique implémentés (2026-09-18), affichage UI/email non fait
- **Date** : 2026-09-18
- **Owner produit** : à désigner
- **Owner technique** : à désigner
- **Périmètre** : attribution, stabilité et affichage d'un numéro de dossard unique par inscription
- **Dépendances** : [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md), [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md), [FDR-0009](./FDR-0009-maintainability-refactor.md), [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md), [FDR-0012](./FDR-0012-user-selected-open-wave.md)
- **Référence source** : audit demandé le 2026-09-18 (refonte inscription : SAS choisi + dossard fixe)

> Cette FDR couvre uniquement le dossard. Le choix de SAS par le coureur est traité séparément dans
> [FDR-0012](./FDR-0012-user-selected-open-wave.md). Les deux features touchent le même point d'entrée
> (`registrations/create`) et doivent être développées avec conscience de l'autre, mais ne sont pas
> couplées fonctionnellement : le dossard existe indépendamment du mode d'assignation SAS.

## 0. Guide de reprise autonome

Un agent qui implémente cette FDR doit :

1. Lire cette FDR en entier, puis [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md) et
   [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md) pour comprendre tous les chemins qui
   mutent une `registration` après création (transfert de format, resync de groupe, correction admin).
2. Lister exhaustivement tout code qui touche `registrations` après l'insert initial — `grep -rn
   "from('registrations')" src/` — et vérifier pour chacun qu'il ne touche jamais `bib_number`. Cette
   FDR ne peut pas se contenter de coder le chemin heureux ; elle doit auditer les chemins existants qui
   pourraient réattribuer un dossard par accident.
3. Vérifier l'état réel des RPC en base (`assign_open_wave_to_registration`,
   `award_ambassador_points_for_order`, etc.) ne sont toujours pas versionnées à la date de reprise
   ([FDR-0009 §1.1](./FDR-0009-maintainability-refactor.md#1-priorité-0--avant-tout-événement-daté-bloquant-sécuritéfiabilité-jour-j)).
   Si ce point est toujours ouvert, la nouvelle RPC d'attribution de dossard doit malgré tout être
   commitée en migration versionnée dès le départ — ne pas reproduire la dette.
4. Ne jamais écrire de logique d'attribution en lecture-puis-écriture séparée côté JS (`SELECT MAX(...)`
   puis `UPDATE`) — c'est exactement le bug de concurrence déjà documenté et non corrigé sur le chemin
   groupe de wave assignment ([FDR-0009 §1.2](./FDR-0009-maintainability-refactor.md)). Le dossard a la
   même exigence d'atomicité que le SAS, avec un blast radius pire : un doublon de dossard est visible
   physiquement le jour J (deux coureurs avec le même numéro).
5. Écrire les tests de concurrence et de non-régression (§8) avant de considérer la RPC terminée.

## 1. Besoin métier

Aujourd'hui, aucune notion de dossard n'existe dans le code (`grep -rn "bib" src/` ne retourne aucune
occurrence métier). L'identifiant visible d'un participant le jour J n'existe pas de façon stable :
seul `qr_code_token` (opaque, non lisible humainement) et `wave_position` (relatif à une vague, recalculé
si la vague change) existent.

Le produit a besoin d'un numéro de dossard :

- **unique** par inscription active sur un événement donné ;
- **lisible humainement**, affiché sur billet, email de confirmation, badge/QR, et vues admin ;
- **stable dans le temps** : une fois attribué, ne change plus jamais, quelles que soient les opérations
  ultérieures sur l'inscription (changement de SAS, transfert de format, correction admin sans
  mouvement financier au sens de FDR-0010, resynchronisation de groupe) ;
- **borné par format** : la plage de numéros va de 1 au nombre maximum de participants autorisés pour
  ce format sur cet événement, OPEN et RANKED ayant chacun leur propre plage indépendante.

## 2. Décision fonctionnelle

**DECISION** — Le dossard est un entier positif, attribué de façon atomique et séquentielle au moment
de la création de la `registration`, dans une plage `[1, max_bib_<format>]` propre à l'événement et au
format (OPEN / RANKED). Il est stocké sur la ligne `registrations` et n'est **jamais réécrit** par un
processus automatique une fois assigné. Une réattribution ne peut se produire que via une action admin
explicite et exceptionnelle (§7), jamais comme effet de bord d'une autre opération.

**DECISION** — Le dossard est indépendant du SAS/de la vague. Changer de SAS (choisi par
l'utilisateur ou réassigné par un admin via le flux [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md))
ne touche jamais `bib_number`.

**DECISION** — Un transfert de format (RANKED→OPEN ou l'inverse) **libère** l'ancien dossard dans
l'ancien format et en **attribue un nouveau** dans le nouveau format, car les plages sont disjointes
par format et un dossard OPEN n'a pas de sens sur une inscription RANKED. Ce transfert est un cas
documenté, pas une exception silencieuse (voir §6).

## 3. Règles métier

### 3.1 Plage et capacité

```
bib_number ∈ [1, max_bib_number]
max_bib_number = capacité maximale de participants pour (event_id, format)
```

- Pour OPEN : capacité = somme des `event_waves.capacity` pour l'événement (ou un plafond dédié si les
  organisateurs veulent une capacité de dossards distincte de la capacité de vagues — **à valider avec
  le produit**, voir DECISION Q-1 ci-dessous).
- Pour RANKED : pas de notion de vague ; capacité = nouveau champ dédié sur `events` (ex.
  `ranked_bib_capacity`), car rien d'existant ne borne aujourd'hui le nombre d'inscriptions RANKED.

**DECISION Q-1 (à valider par le produit avant implémentation)** — La capacité de dossards OPEN
doit-elle être strictement égale à la somme des capacités de vagues (`event_waves.capacity`), ou un
plafond indépendant ? Si indépendant, ajouter `open_bib_capacity` sur `events` plutôt que de dériver de
`event_waves`. Cette FDR part de l'hypothèse **plafond indépendant** (champ dédié) car coupler la
capacité de dossards à la somme des capacités de vagues créerait un couplage fragile : changer la
capacité d'une vague (admin, `EventOpenWavesSection`) changerait silencieusement le plafond de dossards
disponibles, cassant l'invariant "numéroté 1 à N fixe pour l'événement".

### 3.2 Attribution

- Au moment de la création de la `registration` (même point d'entrée que l'attribution de SAS,
  `POST /api/registrations/create`), après confirmation de paiement.
- Le numéro attribué est le plus petit entier disponible dans la plage qui n'est pas déjà utilisé par
  une inscription **active** du même `(event_id, format)`. "Active" exclut les inscriptions annulées
  (voir §3.4 sur la libération).
- Échec si plus aucun numéro disponible dans la plage → l'inscription entière échoue avec une erreur
  explicite (`BIB_CAPACITY_EXHAUSTED`), pas d'inscription "sans dossard" silencieuse.

### 3.3 Stabilité

Le dossard ne doit **jamais** être modifié par :

- un changement de SAS/vague (auto ou choisi, [FDR-0012](./FDR-0012-user-selected-open-wave.md)) ;
- une synchronisation d'ancre de groupe (`syncOpenGroupWave`, [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md)) ;
- une correction admin `NO_MOVEMENT` / `NO_MOVEMENT_EXCEPTION` au sens de
  [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md), **sauf** si la correction change le
  format du billet (voir §6, cas explicite de transfert) ;
- un rejeu de script SQL (`scripts/sql/*.sql`).

Tout code qui écrit sur `registrations` doit explicitement omettre `bib_number` de son `UPDATE`, ou
mieux, la colonne doit être protégée par un trigger PostgreSQL qui rejette toute tentative de mise à
jour de `bib_number` en dehors d'un chemin explicitement autorisé (voir §5.3).

### 3.4 Annulation et libération

**DECISION Q-2 (à valider par le produit)** — Quand une inscription est annulée/remboursée, son
dossard est-il :
- (a) **libéré immédiatement** et redevient attribuable à une nouvelle inscription, ou
- (b) **gelé définitivement** (jamais réattribué, pour éviter toute confusion en cas de réédition de
  billet/badge déjà imprimé) ?

Cette FDR recommande **(b) gelé définitivement** par défaut pour la V1 : plus sûr opérationnellement
(pas de risque qu'un badge physique déjà distribué porte un numéro réattribué à quelqu'un d'autre), au
prix d'une consommation de la plage de numéros plus rapide. À trancher avant implémentation — impacte
directement le calcul de "plus petit entier disponible" en §3.2.

## 4. Interaction avec les features et flux existants

| Flux existant | Impact sur `bib_number` |
|---|---|
| Création registration (paiement confirmé) | Attribution initiale, atomique, même transaction que l'attribution de SAS |
| Transfert RANKED→OPEN (script ou futur flux admin) | Libère l'ancien dossard RANKED, attribue un nouveau dossard OPEN — jamais de réutilisation cross-format |
| Resync groupe ancré ([FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md)) | Aucun effet — ne touche que `wave_index`/`start_time` |
| Changement de SAS admin ([FDR-0010](./FDR-0010-ticket-financial-correction-policy.md)) | Aucun effet — `bib_number` absent du contrat de preview/confirm de FDR-0010, à ajouter explicitement à la liste des champs jamais mutés |
| Choix de SAS utilisateur ([FDR-0012](./FDR-0012-user-selected-open-wave.md)) | Aucun effet — dossard attribué indépendamment, avant ou après le choix de SAS dans la même transaction de création |
| Check-in bénévole | Lecture seule — le dossard doit être affiché/recherché au check-in, jamais modifié |

**Action requise sur FDR-0010** : ajouter `bib_number` à la liste explicite des champs que le contrat
de preview/confirm ne doit jamais faire varier (actuellement FDR-0010 §5 ne le mentionne pas car la
feature n'existait pas au moment de sa rédaction).

## 5. Implémentation

### 5.1 Schéma

Migration versionnée (`supabase/migrations/`), pas de script ad-hoc :

```sql
ALTER TABLE registrations
  ADD COLUMN bib_number integer;

ALTER TABLE events
  ADD COLUMN ranked_bib_capacity integer,
  ADD COLUMN open_bib_capacity integer;

-- Unicité par événement + format, pas par événement seul
CREATE UNIQUE INDEX registrations_bib_number_unique_per_format
  ON registrations (event_id, race_format, bib_number)
  WHERE bib_number IS NOT NULL AND claim_status <> 'cancelled';
```

`race_format` doit être dérivé de façon cohérente avec `isOpenFormatTicket`/`isRankedFormatTicket`
([openSas.ts](../../../src/lib/openSas.ts)) — si ce champ n'existe pas déjà en colonne stockée sur
`registrations`, l'ajouter plutôt que de recalculer le format à partir du nom de billet à chaque
requête d'unicité (un index unique ne peut pas dépendre d'une jointure).

### 5.2 RPC d'attribution atomique

```sql
CREATE FUNCTION assign_bib_number(
  p_event_id uuid,
  p_registration_id uuid,
  p_format text, -- 'open' | 'ranked'
  p_max_bib_number integer
) RETURNS integer
```

Doit utiliser un verrouillage de ligne (`FOR UPDATE`) sur une table de compteur dédiée par
`(event_id, format)`, à l'image du pattern déjà correct de `assign_open_wave_to_registration` (verrouillage
`FOR UPDATE SKIP LOCKED` documenté dans [rpc-reference.md](../guides/rpc-reference.md)) — **pas** un
`SELECT MAX(bib_number)+1` sans verrou, qui produirait la même race condition que celle déjà identifiée
sur le chemin groupe ([FDR-0009 §1.2](./FDR-0009-maintainability-refactor.md)).

Option plus simple et robuste : table `event_bib_counters(event_id, format, next_number)` avec
`UPDATE ... SET next_number = next_number + 1 WHERE event_id = ? AND format = ? AND next_number <=
p_max_bib_number RETURNING next_number - 1`. Un seul `UPDATE` atomique, pas de `SELECT` préalable côté
application.

### 5.3 Protection contre la réécriture

Trigger PostgreSQL sur `registrations` :

```sql
CREATE FUNCTION prevent_bib_number_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD.bib_number IS NOT NULL
     AND NEW.bib_number IS DISTINCT FROM OLD.bib_number
     AND current_setting('app.allow_bib_reassignment', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'bib_number is immutable outside explicit reassignment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Le seul chemin autorisé à poser `app.allow_bib_reassignment = true` est la procédure admin explicite de
transfert de format (§6) ou de correction manuelle exceptionnelle — jamais un chemin automatique.

### 5.4 Point d'entrée applicatif

Dans `POST /api/registrations/create` ([route.ts](../../../src/app/api/registrations/create/route.ts)),
appeler `assign_bib_number` juste après l'insert de la `registration`, avant ou après l'appel à
`assignOpenWaveToRegistration` selon ce qui est décidé pour FDR-0012 — les deux attributions sont
indépendantes et peuvent être parallélisées si les deux RPC sont bien atomiques chacune de leur côté.

Si l'attribution du dossard échoue (`BIB_CAPACITY_EXHAUSTED`), toute la création de registration pour ce
participant doit échouer — pas d'inscription partielle avec SAS mais sans dossard. Vérifier la
cohérence avec le comportement d'erreur déjà en place pour l'échec d'assignation de SAS (ligne
617-620 du fichier, actuellement `throw` propagé).

## 6. Transfert de format (RANKED ↔ OPEN)

Cas explicite, pas une exception :

1. Vérifier que l'inscription source a un `bib_number` non nul dans l'ancien format.
2. Dans une transaction : `UPDATE registrations SET bib_number = NULL WHERE id = ...` (poser
   `app.allow_bib_reassignment = true` pour passer le trigger), puis appeler `assign_bib_number` pour le
   nouveau format.
3. Si le nouveau format n'a plus de dossard disponible (`BIB_CAPACITY_EXHAUSTED`), **annuler tout le
   transfert** — ne jamais laisser une inscription sans dossard dans aucun des deux formats.
4. Auditer l'opération (ancien dossard, nouveau dossard, motif, acteur) selon le même contrat que
   [FDR-0010 §7](./FDR-0010-ticket-financial-correction-policy.md#7-audit-preuve-et-confidentialité).

Les scripts déjà identifiés comme non-audités en détail
([FDR-0009 §1.3](./FDR-0009-maintainability-refactor.md#1-priorité-0--avant-tout-événement-daté-bloquant-sécuritéfiabilité-jour-j))
— `transfer_ranked_to_open_by_emails.sql` notamment — doivent être mis à jour pour appeler cette
procédure au lieu de simplement réassigner la vague, sinon ils produiront des inscriptions OPEN sans
dossard.

## 7. Réattribution manuelle exceptionnelle

Cas réel : erreur de saisie, doublon détecté après coup, demande légitime d'un participant.

- Réservé à un admin habilité (même niveau d'autorisation que `NO_MOVEMENT_EXCEPTION` dans
  [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md#3-matrice-de-politique)).
- Motif obligatoire, action auditée, jamais un simple champ modifiable en édition libre dans l'UI admin.
- Doit vérifier que le nouveau numéro cible n'est pas déjà pris (contrainte unique protège en dernier
  recours, mais l'UI doit vérifier avant pour ne pas exposer une erreur SQL brute à l'admin).

## 8. Tests (TDD obligatoire, succès + échec par use-case)

- Attribution initiale : premier dossard d'un événement = 1, incrémente correctement.
- Attribution concurrente : N requêtes simultanées sur la même plage ne produisent jamais de doublon ni
  de trou inattendu (test d'intégration avec vraies requêtes concurrentes, pas un mock séquentiel).
- Plage épuisée : la N+1-ième tentative échoue proprement avec `BIB_CAPACITY_EXHAUSTED`, aucune
  inscription partielle créée.
- Stabilité : changement de SAS (choisi ou admin) laisse `bib_number` inchangé — test de non-régression
  explicite sur ce point précis.
- Trigger de protection : une tentative de `UPDATE bib_number` hors chemin autorisé lève une exception
  SQL, vérifiée par un test d'intégration qui tente l'update directement.
- Transfert de format : dossard ancien format libéré, nouveau dossard attribué dans le nouveau format,
  jamais les deux formats avec un dossard simultanément, jamais aucun.
- Transfert de format avec plage cible épuisée : transfert annulé intégralement, dossard d'origine
  toujours valide après l'échec.

## 9. Impacts UX / affichage

- Email billet (`sendTicketEmail`) : afficher le dossard, format cohérent avec les conventions
  ([docs/guides/email-conventions.md](../guides/email-conventions.md) — relire avant toute génération
  HTML d'email touchée par ce changement).
- QR/badge check-in et vue check-in bénévole : dossard recherchable, affiché à côté du nom.
- `RegistrationDetailsDialog.tsx` (admin) : afficher le dossard en lecture seule, avec accès à la
  réattribution exceptionnelle (§7) réservée aux rôles autorisés.
- `AccountRegistrationsList.tsx` (coureur) : afficher son propre dossard.

## 10. Critères d'acceptation

- Chaque inscription payée et confirmée reçoit un `bib_number` unique dans son `(event_id, format)`.
- Aucun code applicatif ou script SQL existant ne peut modifier `bib_number` en dehors des chemins
  explicitement autorisés par le trigger.
- Une charge concurrente ne produit jamais de doublon (prouvé par test d'intégration, pas seulement par
  argument théorique sur le verrouillage).
- Un transfert de format produit toujours exactement un dossard valide, jamais zéro ni deux.
- FDR-0010 est mise à jour pour lister `bib_number` parmi les champs jamais mutés par une correction
  `NO_MOVEMENT`/`NO_MOVEMENT_EXCEPTION`.
- Tests succès + échec présents pour chaque règle de §8, suite complète passante, `tsc --noEmit` clean.

## 11. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Race condition sur attribution → doublon physique le jour J | RPC atomique avec verrouillage explicite, testée sous charge concurrente réelle avant activation |
| Script SQL existant non mis à jour réattribue ou ignore le dossard lors d'un transfert | Trigger de protection au niveau DB, indépendant de la discipline applicative ; audit des scripts avant le prochain événement |
| Capacité OPEN dossard divergente de la capacité de vagues, source de confusion admin | DECISION Q-1 à trancher explicitement avec le produit avant migration, documenter le choix dans cette FDR une fois acceptée |
| Dossards gelés (option b, §3.4) épuisent la plage plus vite que prévu sur un événement à fort taux d'annulation | Dimensionner `max_bib_number` avec marge ; réexaminer après un premier événement si le taux d'annulation observé le justifie |
| FDR-0010 et cette FDR livrées par des équipes/sessions différentes, contrat désynchronisé | Cette FDR modifie explicitement la liste de champs protégés de FDR-0010 §5 — traiter comme un seul lot de revue si les deux sont en cours simultanément |
