# Overbound

Site officiel et plateforme d'inscription d'**Overbound**, course à obstacles en **boucle** (environ 2 km, plus de 10 obstacles, tours répétés).

- 1re édition : **Ultra Arena 2026**, 12 septembre 2026, Île de Loisirs de Saint-Quentin-en-Yvelines.
- 2e édition : en préparation pour 2027 (date et lieu non publiés tant qu'ils ne sont pas confirmés).
- Organisateur légal : SASU Palvadeau Organisation.
- Contact : [contact@overbound-race.com](mailto:contact@overbound-race.com)

Ce dépôt n'est pas qu'un site vitrine. Il couvre tout le cycle : découverte, inscription et paiement, groupes entreprise, programme ambassadeur, back-office, check-in le jour J, emails.

## Les deux formats

Les deux formats partagent le même parcours.

| | OPEN | RANKED |
|---|---|---|
| Départ | SAS au choix du participant, vagues toutes les 10 min, de 12h00 à 15h50 (24 vagues) | Départ unique à 8h00 |
| Classement | Aucun | Élimination : dernier coureur en course gagne |
| Temps au tour | Libre | Limites décroissantes (30, 25, 20 min) |
| Obstacle raté | 10 burpees | 30 burpees |
| Points ambassadeur | 1 | 2 |

Les règles chiffrées vivent dans [src/constants/raceFormatRules.ts](src/constants/raceFormatRules.ts). Ne jamais les retaper ailleurs.

## Fonctionnalités

- **Catalogue et page événement** : billets par format, prix dynamiques par palier, places restantes.
- **Inscription multi-étapes** : participants, choix du SAS, options, codes promo, décharge signée, paiement Stripe.
- **Groupes entreprise** : capitaine et membres, ancrage de vague pour démarrer ensemble. Offre B2B sur `/entreprises` (devis, remise de groupe).
- **Programme ambassadeur** : points par parrainage, saison continue, paliers en base, lien `/?ref=CODE`, dashboard dédié.
- **Lucky Wheel** : roue promotionnelle sur tout le site, arbitrée avec les autres popups.
- **Back-office** `/dashboard` : événements, billetterie, participants, groupes, ambassadeurs, codes promo, upsells, listes de diffusion, emails, bénévoles, logs.
- **Check-in jour J** : scan QR et dossard par les bénévoles.
- **Emails** : transactionnel (billets, reçus) via Resend, marketing via Amazon SES, système RGPD à 4 phases.
- **Contenu** : blog en MDX, FAQ via Sanity, bootcamps, volontariat, pages SEO et `llms.txt`.

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Tailwind v4, shadcn/ui, design system maison ([src/components/ds](src/components/ds))
- Supabase : auth, base Postgres, RLS, storage
- Stripe (paiement), Resend (transactionnel), Amazon SES (marketing)
- Sanity (FAQ et studio sur `/studio`), contenu du blog dans [src/content/blog](src/content/blog)
- Sentry, Vercel Analytics, GA4, GTM et Meta Pixel (après consentement), Meta CAPI
- Vitest et Testing Library (unitaires), Playwright et axe (e2e, responsive, accessibilité)
- Hébergement Vercel, crons déclarés dans [vercel.json](vercel.json)

## Démarrage

Prérequis : Node.js récent (compatible Next.js 16) et npm.

```bash
npm install
# créer .env.local (voir "Variables d'environnement")
npm run dev          # http://localhost:3000
```

### Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Sert le build |
| `npm run lint` | ESLint puis garde-fou design |
| `npm run lint:design` | Bloque toute nouvelle violation du design system |
| `npm run lint:design:update` | Enregistre une baisse de violations (refusé en cas de hausse) |
| `npm test` | Tests Vitest (mode watch) |
| `npm run test:coverage` | Couverture |
| `npm run test:e2e` | Playwright : matrice de 12 fenêtres de 320 à 2560 px, parcours checkout, ambassadeur, admin |
| `npm run test:a11y` | Accessibilité (axe) |
| `npm run optimize:images` | Optimisation des images |

Les tests e2e lancent leur propre serveur sur le port 3100. Pour viser un déploiement, définir `PLAYWRIGHT_BASE_URL`. Détails dans [TESTING.md](TESTING.md).

## Variables d'environnement

Aucune valeur n'est versionnée. Les noms attendus, par groupe :

- **Site** : `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `CRON_SECRET`
- **Supabase** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement, jamais préfixée `NEXT_PUBLIC_`)
- **Stripe** : `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Resend (transactionnel)** : `RESEND_API_KEY`, `RESEND_DEFAULT_AUDIENCE_ID`, `RESEND_SEGMENT_UNREGISTERED_ID`, `RESEND_TOPIC_*`
- **Amazon SES (marketing)** : `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_FROM_MARKETING`, `SES_CONFIGURATION_SET`, `SES_SNS_TOPIC_ARN`, `MARKETING_TRANSPORT` (`ses` pour SES), `EMAIL_CONTACTS_SYNC` (`off` neutralise les appels contacts Resend)
- **Désinscription** : `UNSUBSCRIBE_SECRET`
- **Anti-spam** : `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (formulaire `/entreprises`), `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, `HCAPTCHA_SECRET_KEY`
- **Sanity** : `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`
- **Analytics** : `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_CONTAINER_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_DATASET_ID`
- **Notifications push** : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ADMIN_PUSH_EMAILS`
- **Support** : `SUPPORT_INBOX`, `B2B_INBOX`
- **Sentry** : `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`

## Architecture

```
src/
  app/          Routes App Router, pages publiques, /dashboard (admin), api/
  components/   ds/ (primitives du design system), ui/ (shadcn), puis par domaine
  lib/          Logique métier par domaine (openSas, groups, ambassadors, email, orderPricing, luckyWheel...)
  hooks/        Hooks React (registration, events, ambassadors...)
  constants/    Règles partagées (formats, versions légales, images de couverture)
  content/blog/ Articles MDX
  sanity/       Schémas et client Sanity (FAQ)
supabase/migrations/   Schéma, RPC, triggers, RLS
e2e/                   Specs Playwright
emails/                Modèles d'emails
scripts/               Garde-fou design, images, scripts SQL opérationnels
docs/                  ADR, FDR, guides, audit
rulebook/              Règlement officiel et guides participant
```

L'organisation réelle est par domaine dans `src/lib/{domain}`. L'architecture hexagonale décrite dans l'ADR-0001 n'a jamais été implémentée : voir [ADR-0004](docs/adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md).

Il n'existe pas de module CRM partenariats. Les FDR-0001 à 0003 et une partie de `docs/product/vision.md` décrivent une cible abandonnée.

### Crons (Vercel)

| Route | Horaire (UTC) |
|---|---|
| `/api/cron/event-status` | 06:00 |
| `/api/cron/reminders` | 07:00 |
| `/api/cron/document-reminders` | 09:00 |
| `/api/cron/safety-data-purge` | 03:17 |

## Règles de domaine à connaître

Ces points ont déjà causé des incidents. Détails dans [CLAUDE.md](CLAUDE.md).

- **Format OPEN ou RANKED** : toujours `isOpenFormatTicket(ticket, race)` ([src/lib/openSas.ts](src/lib/openSas.ts)), jamais un ID de billet.
- **Vagues** : le SAS OPEN est choisi par le participant et verrouillé atomiquement par RPC. Voir [FDR-0012](docs/fdr/FDR-0012-user-selected-open-wave.md) et [FDR-0013](docs/fdr/FDR-0013-ticket-scoped-departure-waves.md).
- **Ancrage de groupe** : un membre OPEN qui rejoint un groupe ancré est forcé sur la vague d'ancrage.
- **Points ambassadeur** : écrits uniquement par RPC (`award_ambassador_points_for_order`, `ambassador_sync_points`). Ne jamais toucher les agrégats directement. Un code est ambassadeur via `AMBASSADOR_LINK_SELECT` et `isAmbassadorPromoRow`.
- **CGV** : toute modification de fond de `src/app/cgv/page.tsx` exige de changer `CGV_VERSION` dans `src/constants/legalVersions.ts`, dans le même commit. Les billets déjà vendus restent soumis à la version acceptée.
- **Préférences email** : le trigger `sync_notification_prefs_to_lists` couple `notification_preferences` et `list_subscriptions`. Ne jamais écrire l'un sans l'autre.
- **Migrations** : à appliquer avant le déploiement du code qui les utilise. Jamais appliquées en production sans relecture.

## Conventions

- TypeScript strict, pas de `any`, Zod aux frontières d'entrée.
- Pas de logique métier dans les composants UI.
- Tests : un test de succès et un test d'échec par use-case, un bug reproduit égale un test.
- **UI** : lire [docs/design/design-system.md](docs/design/design-system.md) avant tout composant visuel. Tokens de `globals.css` et primitives de `src/components/ds` uniquement. Référence visuelle : route `/design` (404 en production).
- **Emails HTML** : lire [docs/guides/email-conventions.md](docs/guides/email-conventions.md) avant d'écrire un modèle.
- **Typographie** : jamais de tiret demi-cadratin (U+2013) dans les textes du site, des emails ou des docs. `src/lib/noEnDash.test.ts` fait échouer le build.
- Ne jamais committer de données de production (dumps, exports d'emails). Vérifier `.gitignore` avant `git add -A`.

## Documentation

Point d'entrée : [AGENTS.md](AGENTS.md) et [docs/README.md](docs/README.md).

| Sujet | Document |
|---|---|
| Produit | [PRODUCT.md](PRODUCT.md), [docs/product/vision.md](docs/product/vision.md) |
| Décisions techniques | [docs/adr](docs/adr/README.md) |
| Décisions fonctionnelles | [docs/fdr](docs/fdr/README.md) |
| Guides d'implémentation | [docs/guides](docs/guides/README.md) (vagues, groupes, ambassadeurs, email, RPC, opérations critiques) |
| Sécurité, RLS, rate limiting | [docs/security](docs/security/data-and-rls.md) |
| Juridique | [docs/guides/legal.md](docs/guides/legal.md) |
| Audit et dette technique | [docs/audit](docs/audit/AUDIT-2026-09-15-full-codebase-review.md), [FDR-0009](docs/fdr/FDR-0009-maintainability-refactor.md) |
| Exploitation | [docs/operations/runbooks.md](docs/operations/runbooks.md) |
| Règlement et guides participant | [rulebook](rulebook) |

## Licence

MIT. Voir [LICENSE](LICENSE).

© 2026 Overbound. Tous droits réservés sur la marque, le nom et les visuels.
