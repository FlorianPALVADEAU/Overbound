# Engineering Guidelines

## Principes

- TypeScript strict.
- Fonctions courtes et explicites.
- Nommage orienté métier.
- Pas de logique métier dans les composants UI.

## Conventions Next.js

- App Router.
- Schémas Zod aux frontières d'entrée.
- Gestion d'erreurs explicite (pas de `any` silencieux).

## Clean Code

- Une responsabilité principale par module.
- Dépendances injectées via ports/interfaces.
- Éviter les utilitaires globaux non testables.

## Découpage UI (Presentation)

- Un composant `*Dashboard` orchestre, il ne doit pas concentrer tout le rendu.
- Extraire systématiquement:
  - composants de sections (`components/*`) pour table, toolbar, modales, blocs de filtres
  - hooks de comportement (`hooks/*`) pour virtualisation, clavier, état dérivé réutilisable
  - helpers de format/rendu (`shared/presentation/*`) pour couleurs, dates, badges
- Éviter la duplication entre `partners` et `ambassadors`: si une règle visuelle est commune, la mutualiser.
- Toute logique métier reste hors UI: uniquement dans `domain`/`application`.
- API calls autorisés en `presentation`, mais encapsuler les patterns répétitifs dans des fonctions dédiées.
- Si un fichier `presentation` devient volumineux, prioriser l'extraction avant d'ajouter des features.
- Conventions hooks stateful: `use-<feature>-form` pour création/édition, `use-<feature>-quick-*` pour workflows rapides (quick email, quick view), et composants visuels limités au rendu + callbacks.

## Documentation

- ADR pour décision architecture significative.
- FDR pour décision fonctionnelle structurante.
