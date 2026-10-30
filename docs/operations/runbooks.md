# Runbooks

## Setup local (cible)

- Installer dépendances
- Configurer `.env.local`
- Lancer app et tests

## Variables attendues (exemple)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `OPENAI_API_KEY` (ou provider IA choisi)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` : Cloudflare Turnstile (anti-spam du formulaire `/entreprises`, `POST /api/b2b/quote`). Sans `TURNSTILE_SECRET_KEY`, la vérification est ignorée (dev local) ; une fois la clé secrète posée, un jeton absent ou refusé renvoie 403.
- `B2B_INBOX` : boîte qui reçoit les demandes de devis (défaut : `SUPPORT_INBOX`, puis `contact@overbound-race.com`)

## Workflow recommandé

- Ouvrir une issue ou note de besoin
- Produire/mettre à jour FDR si nécessaire
- Implémenter en TDD
- Produire/mettre à jour ADR si décision technique
