# ADR-0001 - Hexagonal architecture as baseline

- Statut: Accepted
- Date: 2026-04-05

## Contexte

Le projet doit rester maintenable en croissance et éviter le couplage framework/logique métier.

## Décision

Adopter l'architecture hexagonale stricte avec séparation `domain/application/infrastructure/presentation`.

## Conséquences

- Testabilité accrue des règles métier.
- Discipline d'architecture requise sur toutes les features.
