# FDR-0001 - Pipeline stages and transitions

- Statut: Accepted
- Date: 2026-04-05

## Décision fonctionnelle

Le pipeline V1 contient: `to_contact`, `contacted`, `replied`, `negotiation`, `signed`, `rejected`.

Chaque changement de statut doit historiser la transition.
