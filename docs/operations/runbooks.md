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

## Workflow recommandé

- Ouvrir une issue ou note de besoin
- Produire/mettre à jour FDR si nécessaire
- Implémenter en TDD
- Produire/mettre à jour ADR si décision technique
