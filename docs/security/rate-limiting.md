# Rate Limiting — Vercel Firewall

- Statut : à appliquer manuellement (dashboard Vercel, hors code)
- Référence : [FDR-0009 §2.1](../fdr/FDR-0009-maintainability-refactor.md), [AUDIT-2026-09-15 §2.2](../audit/AUDIT-2026-09-15-full-codebase-review.md)

## Décision

Pas de rate limiting applicatif (Upstash Redis écarté : coût récurrent pour un
seul événement annuel, quota gratuit insuffisant). Utilisation de **Vercel
Firewall** (WAF natif, gratuit sur tous les plans, y compris Hobby) — règles
IP-based configurées au niveau plateforme, aucune dépendance ni code ajoutés.

## Où configurer

Vercel Dashboard → projet Overbound → **Firewall** → **Rules** → "Create rule"

## Règles à créer

Pour chaque route ci-dessous : condition sur `Path`, action `Rate Limit`.

| Route | Raison | Limite recommandée | Fenêtre | Action au dépassement |
|---|---|---|---|---|
| `/api/auth/account-exists` | Énumération de comptes par email | 10 req | 1 min | Block (10 min) |
| `/api/promotions/validate` | Énumération de codes promo | 15 req | 1 min | Block (10 min) |
| `/api/unsubscribe` | Abus de désabonnement / spam de tokens | 20 req | 1 min | Challenge (CAPTCHA) |
| `/api/registrations/create` | Abus création inscription / spam paiement | 10 req | 1 min | Block (5 min) |
| `/api/checkin` | Scan répété anormal le jour J | 30 req | 1 min | Log only (ne pas bloquer le jour de l'événement — juste surveiller) |

Clé de comptage : par IP (`req.ip`), pas par session — ces routes sont
accessibles sans authentification ou avant authentification complète.

## Pourquoi ces seuils

Seuils volontairement généreux (cf. FDR-0009 risque §8 : "Rate limiting bloque
des utilisateurs légitimes en heure de pointe"). Un utilisateur normal ne
dépasse jamais ces seuils en usage légitime — plusieurs tentatives de code
promo ou une double-soumission de formulaire restent sous la limite. À
durcir seulement après observation de faux positifs nuls sur 2-4 semaines.

## checkin : cas particulier

Ne pas bloquer `/api/checkin` en action automatique le jour de l'événement —
un bénévole qui scanne vite plusieurs dossards ne doit jamais être bloqué en
plein rush. Configurer en **Log only** (visibilité dans Vercel Firewall logs)
plutôt qu'en blocage actif, sauf si un pic anormal (bot, abus) est constaté
après coup.

## Vérification post-configuration

Dans Vercel Dashboard → Firewall → Activity, confirmer que les règles créées
apparaissent avec statut "Active" et qu'aucune règle ne bloque le trafic
légitime des tests E2E / smoke tests internes (si applicable, exempter les IP
de CI via une règle "Allow" placée avant les règles de rate limit).
