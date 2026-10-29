# ADR-0006 - Emails marketing via Amazon SES, audience portée par Supabase

- Statut: Accepted
- Date: 2026-10-29
- Décideurs: Florian Palvadeau
- Référence(s): [ADR-0003](./ADR-0003-resend-transactional-email.md) (partiellement supersédé),
  [FDR-0007](../fdr/FDR-0007-email-distribution-and-preferences.md),
  [implementation-guide-email.md](../guides/implementation-guide-email.md)

## Contexte

Resend gratuit plafonne les contacts marketing à 1000, et 994 étaient atteints. Lever ce plafond coûte
40 € par mois, ce que le projet refuse pour un volume marketing faible (quelques envois par mois).

Le code traitait par ailleurs Resend comme source de vérité de l'audience : les listes d'envoi, les
abonnements affichés à l'utilisateur et les préférences étaient lus ou écrasés à partir des audiences,
segments et topics Resend. Cela contredisait FDR-0007 et rendait toute sortie de Resend impossible sans
perdre les abonnements.

L'audit du chantier a aussi relevé :

- `result.error` ignoré à l'envoi : un rejet du fournisseur était journalisé comme « envoyé ».
- `email_logs.user_id` est un `uuid NOT NULL` : impossible de tracer un envoi à un abonné sans compte.
- L'envoi d'ouverture d'inscriptions n'avait ni lien ni en-tête de désinscription.
- Aucun traitement des bounces et des plaintes.
- Une route de désinscription anonyme qui ne pouvait jamais mettre à jour une ligne (RLS, client non
  authentifié).

## Décision

1. **Supabase est l'unique source de vérité de l'audience marketing** (`list_subscriptions`,
   `notification_preferences`, `email_suppressions`). Le point d'entrée unique est
   `resolveAudience()` dans `src/lib/email/audience.ts`. Resend ne reçoit plus de contacts.
2. **Amazon SES envoie le marketing uniquement** (région UE, Configuration Set dédié, sous-domaine
   d'expéditeur `email.overbound-race.com`). **Resend gratuit reste dédié au transactionnel** (billets,
   reçus, ouverture d'inscriptions individuelle `eventOpenings.ts`). Aucun chemin transactionnel n'est
   modifié par cette décision.
3. **Une abstraction de transport** (`src/lib/email/transport/`) isole le fournisseur. Elle retourne un
   `SendResult` typé (`ok` | `transient` | `permanent`), sans exception pour les erreurs attendues. Le
   choix se fait par `MARKETING_TRANSPORT=ses`, avec Resend par défaut : le retour arrière est un
   changement de variable d'environnement.
4. **Un moteur d'envoi unique, `runCampaign()`** (`src/lib/email/campaign.ts`), pour tout envoi de masse :
   - livraison au moins une fois ; un rejeu ne saute que les lignes `sent` ;
   - registre par destinataire `marketing_sends` (`campaign_key`, `email`), qui couvre aussi les
     abonnés sans compte ;
   - échec fermé : si la liste de suppression ou le registre est illisible, la campagne s'arrête ;
   - disjoncteur après deux paquets entiers en échec ;
   - 14 mails par seconde et budget de 45 s (Vercel Hobby, `maxDuration = 60`) ; un clic suivant reprend.
5. **Clé de campagne dérivée du contenu** : mêmes listes et même contenu forment une seule campagne,
   donc chaque adresse la reçoit une fois. Pour renvoyer, changer le sujet.
6. **Bounces et plaintes** : webhook SNS `/api/webhooks/ses` (signature X.509 vérifiée). Un hard bounce
   ou une plainte alimente `email_suppressions` ; une plainte désinscrit aussi l'utilisateur. Toute
   campagne filtre la suppression avant l'envoi.
7. **Désinscription** : chaque mail marketing porte un lien et les en-têtes `List-Unsubscribe` et
   `List-Unsubscribe-Post` (RFC 8058), y compris pour les destinataires sans compte (token HMAC
   email seul). La route anonyme utilise le client service : le token fait office d'identifiant.
8. **Drapeau `EMAIL_CONTACTS_SYNC=off`** : les fonctions de `resendAudiences.ts` deviennent des no-op.
   Le fichier est conservé jusqu'à la contraction finale.

## Alternatives considérées

- **Payer Resend Marketing (40 €/mois)** : rejeté, coût récurrent disproportionné.
- **Resend Broadcasts sans contacts synchronisés** : le plafond s'applique aux contacts ; pas de
  contournement fiable.
- **Brevo, Mailjet, Postmark** : viables, mais SES coûte environ 0,10 $ pour 1000 mails et ne facture
  pas de palier de contacts.
- **Tout migrer vers SES, transactionnel compris** : rejeté, risque inutile sur les billets et reçus,
  qui tiennent dans le quota Resend gratuit. La réputation reste isolée par sous-domaine.
- **File d'attente complète (queue, workers)** : hors périmètre. Le marketing n'est pas urgent, et la
  reprise manuelle par registre suffit au volume visé.

## Conséquences positives

- Plus de plafond de contacts ; coût estimé de l'ordre de 2 $ par mois au pic.
- L'audience, les consentements et les exports vivent dans la base maîtresse, conformément à FDR-0007.
- Un échec d'envoi est enregistré comme échec ; un rejeu ne duplique pas les envois réussis.
- Réputation du marketing isolée de celle du transactionnel.
- Conformité : désinscription en un clic partout, suppression des bounces et plaintes.

## Conséquences négatives / risques

- **Pas de suivi d'ouverture ni de clic** pour le marketing : seuls delivered, bounce et complaint sont
  suivis (cohérent avec le choix RGPD de ne pas activer le tracking).
- **Livraison au moins une fois** : un crash entre l'envoi et l'écriture du registre peut répéter un
  mail à une adresse. Le champ `ledgerErrors` du rapport signale ces cas.
- **Réputation neuve** : la montée en charge est obligatoire (voir plan de déploiement).
- **Dépendance AWS** en plus de Resend, Supabase et Vercel : deux jeux de clés à gérer.
- **Vercel Hobby** : un envoi dépasse le budget de 60 s au-delà d'environ 600 destinataires ; l'admin
  relance jusqu'à `remaining = 0`.
- Les tables `distribution_lists`, `list_subscriptions`, `notification_preferences` et `email_logs`
  n'ont pas de migration dans le dépôt (voir FDR-0007) ; ce chantier n'y touche pas.

## Plan d'implémentation

Livré par phases indépendantes :

- **P0** : compte AWS, identité SES, DKIM, DNS, sortie du sandbox, Configuration Set, SNS, IAM dédié.
- **P1** : transport SES, webhook SNS, `email_suppressions` (commit `8ffb20e9`).
- **P2** : `resolveAudience()`, drapeau `EMAIL_CONTACTS_SYNC`, routes d'abonnement lues depuis Supabase.
- **P3** : `runCampaign()`, `marketing_sends`, migration des envois marketing, désinscription partout.
- **P4** : déploiement (ci-dessous), documentation, contraction.

### Ordre de déploiement

1. Relire et appliquer `supabase/migrations/20261029100000_marketing_sends.sql` (branche Supabase
   d'abord). **Elle doit précéder le déploiement du code** : sans la table, une campagne s'arrête et
   n'envoie jamais sans enregistrer.
2. Réconcilier les désinscrits Resend absents de Supabase (33 adresses constatées le 2026-10-29) avant
   le premier envoi SES : sinon ces personnes seraient remailées malgré leur désinscription.
3. Déployer. Sur preview : `MARKETING_TRANSPORT=ses` et `EMAIL_CONTACTS_SYNC=off`, envoi test à une
   adresse vérifiée, contrôle des en-têtes bruts. Simulateurs SES `bounce@` et `complaint@simulator.amazonses.com`.
4. Même configuration en production.
5. **Montée en charge** : 50, 200, 500, puis toute la base, un palier par jour, segments les plus
   engagés d'abord. Seuils d'arrêt : bounce supérieur à 2 %, plainte supérieure à 0,1 %. Ne jamais
   envoyer à toute la base le premier jour.
6. **Contraction** (étape séparée, autorisation explicite) : supprimer `resendAudiences.ts`, les
   variables `RESEND_DEFAULT_AUDIENCE_ID`, `RESEND_SEGMENT_*`, `RESEND_TOPIC_*` et les contacts Resend.

## Plan de rollback

- Remettre `MARKETING_TRANSPORT` à sa valeur par défaut : les envois repassent par Resend sans
  changement de code. L'audience reste servie par Supabase.
- `EMAIL_CONTACTS_SYNC` retiré : les appels Resend de contacts reprennent (utile seulement tant que le
  plafond de 1000 n'est pas dépassé).
- `DROP TABLE public.marketing_sends;` annule la migration ; les campagnes doivent alors rester arrêtées.
- Les suppressions (`email_suppressions`) ne sont jamais purgées par un rollback : elles protègent la
  réputation et les droits des personnes.
