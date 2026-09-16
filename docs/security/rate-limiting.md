# Rate Limiting — Vercel Firewall

- Statut : appliqué (2026-09-16) — 1 règle Firewall active, dashboard Vercel
- Référence : [FDR-0009 §2.1](../fdr/FDR-0009-maintainability-refactor.md), [AUDIT-2026-09-15 §2.2](../audit/AUDIT-2026-09-15-full-codebase-review.md)

## Décision

Pas de rate limiting applicatif (Upstash Redis écarté : coût récurrent pour un
seul événement annuel, quota gratuit insuffisant). Utilisation de **Vercel
Firewall** (WAF natif, gratuit sur tous les plans, y compris Hobby) — règles
IP-based configurées au niveau plateforme, aucune dépendance ni code ajoutés.

**Contrainte découverte à l'application** : le plan Hobby limite à **1 règle
Firewall active**. Le plan initial (1 règle par route, 5 routes) n'est pas
applicable tel quel — routes sensibles regroupées dans une seule règle avec
conditions `OR`, `/api/checkin` explicitement exclu (voir plus bas).

## Où configurer

Vercel Dashboard → projet Overbound → **Firewall** → **Rules** → "Create rule"

## Règle appliquée

Une seule règle, conditions `Request Path` groupées en `OR` :

```
Request Path Equals /api/auth/account-exists
OR Request Path Equals /api/promotions/validate
OR Request Path Equals /api/registrations/create
OR Request Path Equals /api/unsubscribe
```

- Rate Limit : Fixed Window, **10 requêtes / 60 secondes**, clé **IP Address**
- Then : **Too Many Requests (429)**

Seuil le plus bas des 4 routes retenu (celui d'`account-exists` et
`registrations/create`) plutôt que 4 seuils différents, faute de pouvoir
créer une règle par route en Hobby.

`/api/unsubscribe` n'a pas l'option "Challenge" (CAPTCHA) disponible en
combinaison avec d'autres conditions dans cette règle groupée — reste sur
429 comme les autres, acceptable (abus de désabonnement reste bloqué, juste
pas de CAPTCHA dédié).

Clé de comptage : IP (`req.ip`), pas session — ces routes sont accessibles
sans authentification ou avant authentification complète.

## checkin : exclu de la règle

`/api/checkin` **volontairement absent** de la règle Firewall — pas de
protection dispo en Hobby au-delà de la règle unique déjà utilisée par les 4
autres routes. Ne jamais bloquer un bénévole qui scanne vite plusieurs
dossards en plein rush le jour J. Risque accepté : pas de rate limiting sur
checkin, surveillance manuelle via Vercel Firewall Activity / logs applicatifs
si comportement anormal constaté.

## Pourquoi ces seuils

Seuils volontairement généreux (cf. FDR-0009 risque §8 : "Rate limiting bloque
des utilisateurs légitimes en heure de pointe"). Un utilisateur normal ne
dépasse jamais ces seuils en usage légitime — plusieurs tentatives de code
promo ou une double-soumission de formulaire restent sous la limite. À
durcir seulement après observation de faux positifs nuls sur 2-4 semaines.

## Si upgrade plan Vercel

Repasser à 5 règles séparées (1 par route, seuils différenciés) si le projet
passe sur un plan supérieur à Hobby — reprendre les seuils du tableau
d'origine ci-dessous à titre de référence :

| Route | Limite | Fenêtre | Action |
|---|---|---|---|
| `/api/auth/account-exists` | 10 req | 1 min | 429 |
| `/api/promotions/validate` | 15 req | 1 min | 429 |
| `/api/unsubscribe` | 20 req | 1 min | Challenge |
| `/api/registrations/create` | 10 req | 1 min | 429 |
| `/api/checkin` | 30 req | 1 min | Log only |

## Vérification post-configuration

Dans Vercel Dashboard → Firewall → Activity, confirmer que les règles créées
apparaissent avec statut "Active" et qu'aucune règle ne bloque le trafic
légitime des tests E2E / smoke tests internes (si applicable, exempter les IP
de CI via une règle "Allow" placée avant les règles de rate limit).
