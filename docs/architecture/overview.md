# Architecture Overview

## Style

Organisation **par domaine dans `src/lib/{domain}`**, pas de séparation hexagonale
stricte. Ce document décrivait auparavant une architecture hexagonale
(`domain/`, `application/`, `infrastructure/`, `presentation/`) qui n'a jamais été
implémentée — voir [ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md)
pour l'analyse complète de cet écart et la feuille de route d'amélioration.

## Réalité actuelle

```
src/lib/{domain}/    ← logique métier, helpers de requête et appels Supabase
                        parfois colocalisés (ex: registration.ts, groups/,
                        ambassadors/, email/, openSas.ts, pricing.ts)
src/app/api/         ← routes Next.js (certaines contiennent de la logique
                        métier qui devrait être dans src/lib/)
src/types/           ← définitions de types + schémas Zod
src/components/      ← UI (certains composants god-object, cf. FDR-0009 §3.3)
```

## Règles

- Pas d'accès DB direct depuis l'UI ou les routes quand une alternative
  centralisée existe (2 violations connues, voir
  [FDR-0009 §3.4](../fdr/FDR-0009-maintainability-refactor.md#34-supprimer-les-2-accès-db-directs-restants-dans-lui)).
- Les use-cases et helpers de domaine restent dans `src/lib/` jusqu'à refactoring
  explicite.
- Zod aux frontières d'entrée API (généralisation en cours, voir
  [FDR-0009 §2.3](../fdr/FDR-0009-maintainability-refactor.md)).
- Pas de `any` dans le nouveau code.
- RLS activée sur toutes les tables métier, moindre privilège par rôle
  applicatif — voir [docs/security/data-and-rls.md](../security/data-and-rls.md).

## Cibles techniques

- Front/API : Next.js App Router, TypeScript strict.
- Persistance/auth/storage : Supabase (RLS strict).
- Email : Resend.
- Paiement : Stripe.
- UI : Tailwind + shadcn/ui.

## Cible théorique (non implémentée)

Une séparation hexagonale stricte (`domain/`, `application/`, `infrastructure/`,
`presentation/`) reste documentée comme cible long-terme dans
[ADR-0001](../adr/ADR-0001-hexagonal-architecture-baseline.md), mais
[ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md) l'identifie
explicitement comme un objectif jamais construit, pas une description de l'état
actuel. Ne pas s'y fier pour comprendre le code existant ; s'y référer uniquement
si un refactoring structurel est explicitement décidé (voir
[FDR-0009](../fdr/FDR-0009-maintainability-refactor.md) pour le plan de
refactoring priorisé actuel).

## Domaines métier

Voir le tableau "Domaines métier clés" dans [CLAUDE.md](../../CLAUDE.md) et les
FDR associés (wave assignment, groupes/ancrage, ambassadeurs, emails) pour le
détail de chaque domaine.
