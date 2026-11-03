# FDR-0022 - Refonte du back-office : pilotage, participants, commandes

- **Statut** : Accepted (code livré sur la branche `worktree-admin-dashboard-overhaul`, migration à appliquer à la main)
- **Date** : 2026-11-03
- **Owner produit** : Florian Palvadeau
- **Références** : [FDR-0008](./FDR-0008-admin-operations-workspace.md) (espace opérations),
  [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md) (corrections financières),
  [FDR-0021](./FDR-0021-open-companion-option.md) (billet compagnon OPEN),
  [design-system.md](../design/design-system.md)

## Contexte

Une revue du dashboard admin (note 46/100) a relevé : une vue d'ensemble qui n'aide pas à décider,
des chiffres globaux alors qu'un événement est sélectionné, deux listes d'inscrits qui se doublonnent
(« Membres » et « Participants »), aucune page de commandes, aucun remboursement, une suppression
d'inscription définitive qui laissait les compteurs de SAS et les points ambassadeur faux, des colonnes
de tableau inaccessibles, et un ancien système d'onglets (`?tab=`) qui coexistait avec les routes.

## Décisions

| Sujet | Décision |
|---|---|
| Vue d'ensemble | Calculée en TypeScript (`src/lib/admin/overview.ts`, pure et testée), plus par le RPC `admin_overview` non versionné. Une zone « À traiter » (remboursements en échec, paiements en attente depuis plus de 2 h, inscriptions sans SAS alors que le billet en exige un, SAS à 90 % ou plus, nouveaux devis B2B), des chiffres limités à l'événement choisi dans la barre du haut, les ventes par jour sur 30 jours (jour de Paris), la tendance sur 7 jours. |
| Un seul endroit pour les inscrits | `/dashboard/events/[id]/participants` remplace « Membres ». `/dashboard/participants` choisit l'événement (ouvre directement s'il n'y en a qu'un). `/dashboard/members` n'existe plus. |
| Liste des participants | Recherche par e-mail, **nom** (profil du compte) et identifiant. Filtres billet, SAS (dont « sans SAS »), statut (actives, annulées), check-in. Colonnes dossard, départ, paiement, groupe, motif d'annulation. Export CSV de **toutes** les lignes filtrées (pas seulement la page), formules neutralisées, BOM UTF-8, tracé dans les journaux. Actions : changer billet, changer SAS, renvoyer le billet, copier l'e-mail, annuler. Action groupée : copier les e-mails. |
| Suppression d'inscription | Supprimée. `DELETE /api/admin/registrations/[id]` répond 410. L'annulation (`POST .../cancel`) conserve la ligne, invalide le QR, libère le SAS et recompte `event_waves.assigned_count`, annule le compagnon OPEN, déclenche les triggers de révocation des points ambassadeur. Motif obligatoire. |
| Remboursement | Optionnel à l'annulation : aucun, prix du billet (compagnon OPEN inclus), ou montant libre plafonné au prix payé. Ordre : réservation d'une ligne `ticket_refunds`, remboursement Stripe (clé d'idempotence), puis annulation. Un échec Stripe n'annule rien. Un échec d'annulation après remboursement est signalé comme tel. L'admin ne rembourse que `paid_ticket_cents`, jamais les options ou frais. |
| Commandes | `/dashboard/orders` : statut, montant, remboursé, inscriptions, événement, lien Stripe, renvoi du reçu. Filtrable par événement et par statut. |
| Tableaux | `OperationsList` retient le choix de colonnes par liste (localStorage) et expose le sélecteur « Colonnes » partout : avant, **aucune** liste ne le branchait, donc les colonnes masquées par défaut étaient inaccessibles sur ordinateur. Plus de colonnes à largeur égale ni de contenu rogné (`table-fixed` + `overflow-hidden` retirés). La pagination affiche « 1 à 50 sur 312 » et calcule les pages sans supposer 50 lignes. |
| Navigation | Une entrée par page (`resolveActiveNavValue`), Participants et Commandes dans « Billetterie », « Utilisateurs » renommé « Comptes utilisateurs ». Le sélecteur d'événement n'apparaît que sur les pages qui s'en servent. Le lien Check-in n'utilise plus l'ancienne URL `?tab=`. |
| Ancien système d'onglets | `AdminDashboard`, `useAdminDashboardStore` et `RegistrationsSection` supprimés. Les liens `?tab=` déjà envoyés par e-mail ou notification redirigent (`resolveLegacyTabRoute`). Les émetteurs (webhook Stripe, création d'inscription, e-mails ambassadeur, digest admin) pointent sur les vraies pages. |
| Session | Le layout ne démonte plus tout le back-office à chaque rafraîchissement de session : les dialogues et brouillons ouverts survivent au retour sur l'onglet. |
| Contact bénévole | Plus de numéro codé en dur : `COMPANY_INFO`. |
| Devis B2B | Suppression ajoutée (route, test, action dans la liste). |
| Journal (logs) | Sur `OperationsList`. L'API est validée par Zod et passe en pagination par curseur (`created_at`, `id`), le curseur étant partagé avec les commandes (`keysetCursor.ts`). Filtres méthode, statut, recherche (résumé, chemin, e-mail, action, erreur) et dates (jours de Paris). Le compte reste celui du résultat filtré, curseur exclu. |
| Ambassadeurs | Classement de la saison et récompenses sont deux `OperationsList` (pagination côté client via `useClientPagination`, l'API renvoie tout). Une ligne ouvre la fiche. Changement de statut, annulation et réouverture partagent `useRewardActions` ; le motif se saisit dans un dialogue (plus de `window.prompt`) et les échecs s'affichent au lieu de rejeter sans bruit. Le fichier de 890 lignes est découpé en cinq composants. |
| Lucky Wheel | Les listes utilisaient déjà `OperationsList`, mais les écritures mettaient à jour une clé de cache que les tableaux paginés ne lisent pas : une campagne créée, supprimée ou mise en pause n'apparaissait qu'après rechargement. Les écritures invalident désormais toute la famille de requêtes. |
| Validation Zod | `PUT /api/admin/promotional-codes/[id]` (partage le schéma de la création, 409 sur code en double, 404 si absent, plus de `any`) ; `POST /api/admin/tickets` et `PUT /api/admin/tickets/[id]` (un prix non numérique renvoie 400 au lieu d'écrire `NaN`). |

## Migration (à appliquer à la main, avant le déploiement)

`supabase/migrations/20261103130000_admin_cancel_registration.sql` :

- `ticket_refunds.reason` accepte `admin` en plus de `flexible` ; colonnes `admin_user_id` et `note`.
- Fonction `admin_cancel_registration(p_registration_id, p_reason)` : même annulation atomique que
  `cancel_registration_for_flexible_refund`, avec le motif en paramètre. `service_role` uniquement.

Sans cette migration, l'annulation admin échoue (la fonction n'existe pas) et un remboursement admin est
refusé par la contrainte. La vue d'ensemble, les participants, les commandes et l'export n'en dépendent pas.

## Limites connues

- Les commandes sans filtre événement ne sont pas bornées à l'organisation (la base n'a qu'une organisation).
- La vue d'ensemble relit les inscriptions de l'événement à chaque chargement (1000 lignes par requête,
  50 000 au plus) : correct à l'échelle actuelle, à remplacer par une agrégation SQL versionnée au-delà.
- Rembourser le prix d'un billet ne rembourse ni les upsells ni les frais de l'option flexible.
- `/api/admin/registrations` (GET, CSV historique) reste en place mais plus aucun écran ne l'appelle.
- 30 routes sous `src/app/api/admin` n'ont toujours pas de schéma Zod (groupes, événements, courses, obstacles,
  promotions, paliers de prix, bénévoles, e-mails, inscriptions...). Seules les routes citées plus haut sont couvertes.
- L'API des points ambassadeurs renvoie tous les ambassadeurs et garde des `any` historiques ; la pagination de
  ses deux listes est faite dans le navigateur.
- Aucun écran n'a été vérifié dans un navigateur : le contrat responsive (`npm run test:e2e`) n'a pas été rejoué
  sur les pages refaites.

## Tests

`overview`, `cancelRegistration`, `resendTicket`, `participantsCsv`, `ordersList`, `legacyTabRoutes`,
`columnVisibility`, `adminNavItems`, `participantUrlState`, `CancelRegistrationDialog` (saisie du montant),
DELETE des devis B2B, `logsList` (schéma, jours de Paris, curseur), `clientPagination`, `rewardStatus`,
`ambassadorFilters`, PUT des codes promo, `ticketInput`.
