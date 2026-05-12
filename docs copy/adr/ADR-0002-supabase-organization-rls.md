# ADR-0002 - Supabase with organization-first RLS

- Statut: Accepted
- Date: 2026-04-05

## Contexte

Le projet démarre single-user mais doit supporter le multi-utilisateur sans refonte.

## Décision

Structurer les données autour de `organization_id` et appliquer RLS sur toutes les tables métier.

## Conséquences

- Migration vers multi-user simplifiée.
- Coût initial de modélisation et politiques RLS plus élevé.
