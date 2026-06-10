# ADR-0003 - Resend for transactional outbound email

- Statut: Accepted
- Date: 2026-04-05

## Contexte

Besoin d'envoi simple d'emails transactionnels avec pièces jointes et intégration Next.js rapide.

## Décision

Utiliser Resend comme provider d'envoi pour le MVP.

## Conséquences

- Intégration rapide et claire.
- Dépendance à un provider externe (abstraction via port nécessaire).
