# FDR-0016 — Planning bénévoles : choix du poste, répartition par zone, export

- **Statut** : Proposed — code livré, migration SQL écrite mais non appliquée
- **Date** : 2026-10-07
- **Owner produit** : Florian Palvadeau
- **Références** : [FDR-0009](./FDR-0009-maintainability-refactor.md) (migrations relues puis appliquées à la main),
  [ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md)

## Décision

1. **Le bénévole choisit un pod** (type de poste), pas une zone : Accueil, Obstacles, Ligne d'arrivée, Ravito,
   Sponsors & logistique, Consignes (gestion et sécurité des affaires personnelles des participants), ou « Je laisse
   l'équipe décider ». Un créneau : matin, après-midi, toute la journée. Nom saisi en deux champs (prénom, nom),
   stocké sous la forme « Prénom NOM » dans `volunteer_applications.full_name`.
2. **Les zones sont décidées par le système** : un pod = une ou plusieurs zones. Obstacles → zones A à D, répartis de
   façon reproductible avec un poids double pour C et D (les plus importantes). Les autres pods = une zone.
3. **L'admin ajuste, la répartition automatique respecte** : une affectation posée ou déplacée à la main est verrouillée ;
   RESP et AIDE sont toujours saisis à la main ; relancer la répartition ne déplace que les nouveaux bénévoles.
4. **Effectif cible par zone et par créneau** (optionnel). Une zone qui l'atteint est grisée côté admin et n'est plus
   proposée comme destination. Les zones en manque sont signalées. RESP/AIDE comptent dans l'effectif.
5. **Export `.xlsx`** à tout moment depuis l'admin, même mise en page que le planning envoyé aux bénévoles :
   un bloc matin (RANKED) et un bloc après-midi (OPEN), une colonne par zone, RESP puis AIDE puis bénévoles.

Retirés : chronométrage / lap checkers, départ et SAS (assurés par les speakers), flux village.

## Architecture (`src/lib/volunteers/`)

| Dossier | Rôle |
|---|---|
| `shared/` | Pod, créneau, disponibilité, nom de personne : vocabulaire commun à l'inscription et au planning |
| `apply/` | Candidature publique : validateur par étapes, catalogue des événements ouverts |
| `planning/domain/` | Zone, affectation, effectif des zones, `VolunteerPlanner`, `PlanningSheet` — sans I/O |
| `planning/application/` | Un cas d'usage par classe, au-dessus des ports `PlanningRepository` / `PlanningWorkbookWriter` |
| `planning/infrastructure/` | Dépôt Supabase, écriture Excel (ExcelJS), assemblage `createPlanningServices` |

Les routes `api/admin/volunteers/planning/*` ne font que : authentification, validation Zod du transport, appel d'un
cas d'usage, traduction de `PlanningError` en 422. Les tests des cas d'usage utilisent un dépôt en mémoire.

## Données

Migration `supabase/migrations/20260929100000_volunteer_planning.sql` : tables `volunteer_assignments` et
`volunteer_zone_settings` (RLS activée, accès service-role uniquement). `volunteer_applications` est inchangée :
créneau et pod sont retrouvés depuis `availability` et `preferred_mission` (anciens libellés compris). Les libellés de
pod sont donc un contrat : ne pas les renommer sans migrer les données.

## Limites connues

- Le formulaire public ne masque pas un pod dont les zones sont pleines (il ne connaît pas les effectifs) : les
  surplus apparaissent dans « À placer ».
- Prénom et nom ne sont pas stockés dans des colonnes séparées (il faudrait une migration sur `volunteer_applications`).
- Candidatures « Logistique & village », « Départ & SAS », etc. de l'ancienne version : à placer à la main.
- Les titres des blocs (`MATIN - RANKED - 07:00 à 12:00`, `APRÈS-MIDI - OPEN - 12:00 à 19h`) sont fixes dans le code.
