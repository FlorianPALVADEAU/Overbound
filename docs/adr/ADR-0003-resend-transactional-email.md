# ADR-0003 - Resend for transactional outbound email

- Statut: Accepted (partiellement supersédé par [ADR-0006](./ADR-0006-marketing-email-ses-supabase-audience.md))
- Date: 2026-04-05

> **2026-10-29** : Resend reste le fournisseur des emails **transactionnels** uniquement (billets,
> reçus, ouverture d'inscriptions individuelle). Les envois **marketing** passent par Amazon SES et
> l'audience vit dans Supabase, voir ADR-0006.

## Contexte

Besoin d'envoi simple d'emails transactionnels avec pièces jointes et intégration Next.js rapide.

## Décision

Utiliser Resend comme provider d'envoi pour le MVP.

## Conséquences

- Intégration rapide et claire.
- Dépendance à un provider externe (abstraction via port nécessaire).
