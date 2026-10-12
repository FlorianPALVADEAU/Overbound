# ADR-0005: Design system tokenisé (Tailwind v4) et garde-fou en cliquet

**Date** : 2026-10-11
**Statut** : Accepted
**Référence** : [docs/design/design-system.md](../design/design-system.md)

## Contexte

Le site n'avait aucune règle visuelle partagée. Mesures faites le 2026-10-11 sur le site public
(`src/app` et `src/components`, hors admin) :

- 42 `<h1>` pour 29 styles différents, 101 `<h2>` pour 45 styles, 47 variantes d'eyebrow ;
- 36 combinaisons de conteneur, 16 valeurs de `tracking` dont 11 arbitraires ;
- environ 20 combinaisons de padding de section, 57 % des sections sans padding vertical ;
- 5 fonds sombres différents, `#26AA26` codé en dur 38 fois en doublon du token `primary` ;
- 78 tailles de police arbitraires.

Un sous-ensemble cohérent existait déjà : les composants « landing » de la page événement
(`LandingBand`, `LANDING_X`, `SectionEyebrow`).

## Décision

1. **Tokens CSS-first dans `src/app/globals.css`** (Tailwind v4, pas de `tailwind.config`) : échelle
   typographique fluide (`--text-display-*`, `--text-title`, `--text-lead`, `--text-eyebrow`,
   `--text-label`), tracking, surfaces (`surface-deep`, `surface-base`), niveau de texte `subtle`,
   couleur `signal`, ombre `glow`, easing `standard`. Les tons de bande (`.tone-light`,
   `.tone-primary`) remappent les tokens sémantiques en place au lieu de dupliquer des classes.
2. **Police display condensée** chargée par `next/font` (`--font-display-face`), Geist restant la
   police de texte.
3. **Primitives dans `src/components/ds/`** (`Container`, `Section`, `SectionHeader`, `Eyebrow`,
   `StatRow`, `Pill`), généralisées à partir des composants landing. Les variants de bouton et de
   carte restent dans les composants shadcn existants (`ui/button.tsx`, `ui/card.tsx`) via `cva`,
   sans changer leurs valeurs par défaut.
4. **`tailwind-merge` étendu** (`src/lib/utils.ts`) pour connaître les tailles et tracking
   personnalisés ; sinon `cn('text-display-md', 'text-primary')` supprimait la taille.
5. **Garde-fou `scripts/lint-design.mjs` en cliquet**, sans nouvelle dépendance, branché dans
   `npm run lint`. Il compte les motifs interdits par fichier et les compare à
   `scripts/design-baseline.json`. Il empêche toute nouvelle violation tout en laissant migrer
   l'existant page par page.

## Alternatives écartées

- **Plugin ESLint Tailwind** : le support Tailwind v4 est partiel et il ne sait pas exprimer
  « interdit sauf dans le code historique ». Le cliquet maison fait 150 lignes et ne dépend de rien.
- **Composants `Heading` / `Text` génériques** : les classes de tokens suffisent pour le texte ; un
  composant n'est ajouté que là où il porte une règle de mise en page (`SectionHeader`).
- **Réécriture complète en une fois** : risque de régression trop élevé sur le tunnel de paiement. La
  migration se fait par phases (voir le plan dans `docs/design/design-system.md` et les PR associées).

## Conséquences

- Tout nouveau code UI public passe par les tokens et les primitives ; `npm run lint` échoue sinon.
- La migration (phases P1 à P8) est terminée : la baseline est passée de 637 violations à 3
  exceptions assumées (`Footer.tsx`). Toute nouvelle violation fait échouer `npm run lint`.
- Changer de police display ne touche qu'un import dans `src/app/layout.tsx`.
- Il n'y a pas de workflow CI dans le dépôt à cette date : le garde-fou s'exécute via `npm run lint`
  en local et devra être ajouté au pipeline quand il existera.
