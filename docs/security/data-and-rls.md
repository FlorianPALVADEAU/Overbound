# Data Security and RLS

## Principes

- Isolation stricte des données par organization.
- RLS activée sur toutes les tables métier.
- Moindre privilège sur les rôles applicatifs.

## Données personnelles (minimales)

- Nom, email, téléphone professionnel, notes métier.
- Pas de collecte inutile.

## Règles opérationnelles

- Secrets uniquement via variables d'environnement.
- Journaliser les actions sensibles (envoi email, changement statut final).
- Vérifier l'identité avant toute action d'écriture.
