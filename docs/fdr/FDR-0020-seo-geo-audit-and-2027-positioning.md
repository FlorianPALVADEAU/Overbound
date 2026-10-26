# FDR-0020 — Audit SEO/GEO et positionnement 2027

- **Statut** : Proposed — aucune ligne de code modifiée, seul ce document existe
- **Date** : 2026-10-26
- **Owner produit** : Florian Palvadeau
- **Périmètre** : visibilité organique (Google) et visibilité dans les réponses des IA (GEO), Paris uniquement
- **Sources** : code du dépôt au 2026-10-26 ; export Search Console 12 mois (`TEMP/*.csv`, du 2025-10-25 au 2026-10-25) ;
  coffre de connaissance `03-Project/Overbound` (positionnement, édition 2026, décisions 2027) ; recherches web du 2026-10-26
- **Références croisées** : [FDR-0015](./FDR-0015-homepage-evergreen-and-conversion-funnel.md) (accueil evergreen),
  [design-system](../design/design-system.md)

> **Contrainte produit** : `2027-Decision-Gates` interdit d'annoncer une date ou d'ouvrir la billetterie sans validation
> (site, assurance, entité légale). Le site ne publie donc **aucune date précise** tant qu'elle n'est pas confirmée.
> Le coffre mentionne juin 2027 comme hypothèse ; le fondateur indique avril 2027 (24 avril non confirmé). Les deux sont
> non publiables aujourd'hui.

---

## 1. Ce que disent les données (Search Console, 12 mois)

| Indicateur | Valeur |
|---|---|
| Clics / impressions | ~2 560 / ~10 700 (CTR 24 %, position moyenne ~5) |
| Mobile | 75 % des clics (1 911) |
| France | 97 % des clics |
| Clics sur requêtes de marque (`overbound race`, `overbound`, `over bound`, `overbund`) | ~1 430 sur 1 530 listés, soit >90 % |
| Clics sur requêtes génériques (`course obstacle paris`, `backyard paris`, `course obstacle 2026`…) | ~35 |
| Accueil | 2 399 clics (94 % du trafic) |

**Lecture** : le site est trouvé par les gens qui connaissent déjà la marque. Il n'acquiert quasiment personne par le
besoin (« course à obstacles Paris »). Pour une édition 2027 plus grande, c'est le levier à construire.

Opportunités chiffrées dans l'export (impressions élevées, clics quasi nuls) :

| Requête / page | Impr. | Clics | Position | Diagnostic |
|---|---|---|---|---|
| `race bound` | 617 | 18 | 6,6 | variante de marque : s'approprier |
| `backyard paris` | 386 | 6 | 8,7 | thème porteur, aucune page ne le cible |
| `course obstacle paris` / `… 2026` | 163 / 144 | 20 | 4,9 / 6,3 | proche du top, CTR 6 % : title « 2026 » périmé |
| `course obstacle 2026` (+ variantes) | ~250 cumulées | ~3 | 8–10 | pas de page 2027 |
| `backyard race`, `backyard obstacle course` | 57 / 11 | 0 / 6 | 7,7 / 1,3 | forte pertinence, EN |
| `course obstacle famille 2026` | 20 | 0 | 8,3 | angle famille non traité |
| `/volunteers` | 2 668 | 85 | 6,5 | requêtes « bénévole marathon / événement sportif » : trafic hors cible, CTR 3 % |
| `/cgv`, `/cgu` | 1 178 / 668 | 15 | ~2 | 1 800 impressions gaspillées sur des pages légales |
| `/bootcamps` | 1 296 | 17 | 2,2 | bien classé, CTR 1,3 % : title ou snippet faible |
| `/races/origin`, `/races/ultra-arena`, `/races/tribale-kids` | 716 | 8 | 2,4 | pages `/races/*` indexées, non liées du site (voir FDR-0015 §6) |
| `/blog/*` | ~200 | 5 | 1,8–7 | le blog ne rapporte rien |

## 2. Audit de l'existant

### 2.1 Ce qui fonctionne
- `sitemap.ts` dynamique (statiques, événements Supabase, blog et taxonomies Sanity), `robots.ts` propre, noindex
  volontaire des pages de compte avec crawl autorisé.
- Canonical sur accueil, événements et articles ; noindex des événements `draft` / `cancelled`.
- JSON-LD présent : `SportsOrganization` global, `SportsEvent` avec `Offer` (prix du palier actif), `FAQPage`, article de
  blog.
- Accueil rendu côté serveur (revalidate 60 s), H1 unique, FAQ de 10 questions en H3, redirections 301 propres.
- Marque : position 1 sur `overbound race`, CTR 78 %. Le travail de marque est fait.

### 2.2 Ce qui ne va pas

**P0 — contenu périmé ou faux**
1. `layout.tsx`, `metadata.ts` et `events/layout.tsx` annoncent « Paris 2026 », « Inscriptions ouvertes » alors que
   l'édition du 12 septembre 2026 est passée. Title et description visibles dans Google, donc dans les réponses des IA.
2. `/events` répond `notFound()` (404) alors que son layout déclare un canonical et des métadonnées « Inscriptions
   ouvertes ». Le lien « Événement » du header pointe en dur sur `/events/ultra-arena-2026`.
3. `SportsEvent` : schema.org n'a pas d'état « terminé » (`EventScheduled` reste valide pour une édition passée). Le vrai
   défaut : un événement `on_sale` dont la date est passée n'était pas converti en `completed` dans le JSON-LD de la page
   événement (corrigé via `getEffectiveEventStatus`).
4. Mots-clés `spartan race alternative`, `mud day alternative` : marques tierces, aucun effet Google, risque de contenu
   comparatif non assumé.

**P1 — structurel**
5. L'accueil ne dit nulle part dans le texte rendu **où** (Île de loisirs de Saint-Quentin-en-Yvelines), **quand** ni
   **combien**. Une IA qui résume la page ne peut pas répondre à « où et quand est Overbound ? ».
6. Aucun `llms.txt`, aucune règle explicite pour les robots IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended,
   OAI-SearchBot). Par défaut `allow: /`, donc crawlables, mais sans signal ni guide de lecture.
7. JSON-LD incomplet : pas de `WebSite`, pas de `BreadcrumbList` hors blog, `Organization` sans `legalName`,
   `foundingDate`, `founder`, `contactPoint` ; `SportsEvent` sans `endDate`, `performer`, `geo` ; `streetAddress` rempli avec
   le nom du lieu ; aucun `VideoObject` malgré le trailer.
8. Aucune page ne cible le besoin « course à obstacles Paris / Île-de-France » ni « backyard » : le positionnement vit dans
   les `keywords` meta (ignorées par Google) et dans les `title`, pas dans du contenu.
9. Pages `/races/*` indexées avec des impressions mais orphelines et contenant une règle fausse (« 1h par tour »).
10. `/cgv` et `/cgu` ressortent à la position ~2 sur des requêtes qui n'ont rien à voir : ajouter `noindex`
    est discutable (obligation légale d'accessibilité, pas d'indexation) ; à arbitrer.
11. Signal de marque confus : les requêtes `race bound`, `over bound`, `overrace`, `overbund` montrent une confusion
    d'orthographe. Aucune page ne l'adresse.

**P2 — écosystème et mesure**
12. Les fiches tierces (Finishers, Miles Republic, werun.world) ressortent, souvent avec des données erronées (une fiche
    donne 10 km). Elles alimentent les IA autant que le site.
13. Aucun contenu en anglais ; les requêtes `backyard obstacle course` et `backyard race` (EN) existent. Hors cible
    géographique (Paris), donc basse priorité.
14. Blog : ~200 impressions en 12 mois, 5 clics. Pas de maillage vers l'événement ni vers les formats.
15. Mesure : pas de suivi des citations IA, pas de rapport Search Console récurrent, pas de Bing Webmaster Tools (source
    principale de plusieurs assistants IA).

**Non vérifié (à contrôler après accord)** : HTML brut et JSON-LD réellement servis en production, Core Web Vitals, poids
et alt des images, volume et qualité des articles de blog, backlinks, état Bing.

## 3. Positionnement à porter (synthèse du coffre)

- **Quoi** : course à obstacles sur boucle d'environ 2 km, répétée. Deux formats : **RANKED** (éliminatoire, cut-off de
  plus en plus court) et **OPEN** (sans classement, départs échelonnés toutes les 10 minutes).
- **Pour qui** : du débutant au compétiteur, familles, équipes d'entreprise. « Exigeant mais convivial », village,
  communauté, sécurité (Croix-Rouge, aucun blessé grave en 2026).
- **Preuves 2026** : ~310 partants, ~324 billets actifs, retours qualitatifs très positifs. Les chiffres varient selon la
  définition (billets vendus, actifs, partants) : n'utiliser que « plus de 300 participants » en public.
- **Point de vigilance** : le coffre note que le format « backyard » classique n'a pas été livré tel quel en 2026
  (RANKED = boucles avec cut-off dégressif, proche du backyard mais pas « dernier debout »). Le site et les métadonnées
  disent « première course à obstacles format backyard en France ». Cette affirmation n'est pas sourcée. À valider ou
  reformuler en « inspirée du backyard ultra » avant de la répéter dans le JSON-LD et le `llms.txt`.

## 4. Plan proposé

Chaque lot est une PR séparée. Aucun n'est démarré.

### Lot A — Plan d'urgence (P0)
1. **Page `/events` « prochaine édition »** en remplacement du 404 : remerciement aux ~300 participants de 2026, accès au
   récap et aux photos (`events.photos_url`, FDR-0015 §9), bloc « Édition 2027 : on prépare », **sans date** (gate
   Décision), formulaire de liste d'attente (réutiliser le popup newsletter / la liste de distribution `events-announcements`).
   Canonical `/events`, indexable, `Event` non émis tant que la date n'est pas publique.
2. **Réécrire title, description, OG et keywords** de `layout.tsx` / `metadata.ts` / `events/layout.tsx` sans « 2026 » ni
   « Inscriptions ouvertes » : formulation evergreen + « édition 2027 bientôt ». Une seule source (supprimer le doublon entre
   `layout.tsx` et `metadata.ts`).
3. **Gérer l'état « terminé »** dans `EventStructuredDataServer` : `eventStatus` cohérent, `endDate`, offres retirées, et sur
   `/events/ultra-arena-2026` un bandeau « édition terminée » renvoyant vers `/events`.
4. **Header** : lien « Événement » dynamique (événement vedette si ouvert, sinon `/events`).
5. Retirer les mots-clés de marques tierces.

### Lot B — Contenu qui capte le besoin (P1)
6. **Page piliers** (une par intention, rédigées pour être citées) : « Course à obstacles à Paris / Île-de-France » (OPEN vs
   RANKED, boucle de 2 km, pour débutants et familles) ; « Qu'est-ce qu'un backyard à obstacles » ; « Overbound : date, lieu,
   prix, formats » (page de faits). Chaque page : réponse en tête (40–60 mots), tableau de faits, FAQ, maillage interne.
7. **Faits dans le HTML de l'accueil** : lieu, type d'événement, formats, « édition précédente : 12 septembre 2026,
   Île de loisirs de Saint-Quentin-en-Yvelines, plus de 300 participants ».
8. **Corriger `/races/*`** (règle fausse) et les relier, ou les fusionner dans `/events/formats` avec redirection 301.
9. **Page bénévoles** : revoir title et H1 pour la requête réelle (« devenir bénévole course à obstacles Paris ») et filtrer
   le trafic « marathon ».
10. **Titles/snippets** de `/bootcamps` (CTR 1,3 % à la position 2,2) et de la page de marque (variantes `race bound`).

### Lot C — GEO
11. **`/llms.txt`** (et `/llms-full.txt`) : description factuelle, liens vers les pages de faits, règles de citation. Route
    Next dédiée alimentée par les mêmes constantes que l'accueil.
12. **`robots.ts`** : règles explicites par robot IA (autoriser les robots de réponse/recherche ; décision à prendre sur
    l'entraînement : GPTBot, Google-Extended, CCBot).
13. **JSON-LD complet** : `WebSite`, `Organization` enrichie (`legalName`, `foundingDate`, `founder`, `contactPoint`,
    `sameAs` avec Finishers et Miles Republic), `BreadcrumbList` partout, `SportsEvent` complet (`geo`, adresse structurée,
    `endDate`, `performer`), `VideoObject` pour le trailer, `FAQPage` sur les pages piliers. Source unique dans
    `src/lib/seo/` avec tests (succès + échec) selon la stratégie de test.
14. **Fiches tierces** : corriger Finishers, Miles Republic, werun.world, Google Business Profile (action humaine, liste de
    contrôle fournie avec la PR).

### Lot D — Édition 2027, quand la date est validée
15. Une seule bascule de données (statut événement en base) fait passer `/events` du mode « on prépare » au mode
    « inscriptions ouvertes » ; le JSON-LD `SportsEvent` et le sitemap suivent sans redéploiement de code.
16. Annonce : mise à jour `llms.txt`, communiqué, fiches tierces, email à la liste d'attente.

### Lot E — Mesure
17. Search Console : rapport mensuel sur les mêmes CSV ; objectif 2027 : part de clics hors marque de 3 % à 25 %.
18. Bing Webmaster Tools + soumission du sitemap ; test mensuel de 15 questions dans ChatGPT, Perplexity, Gemini, Claude
    (« course à obstacles à Paris », « Overbound c'est quoi », etc.), résultats consignés dans le coffre.

## 5. Décisions validées (2026-10-26)

| # | Décision |
|---|---|
| 1 | Pas de date publique. Zone annoncée : « entre avril et juin 2027 » (la date n'est pas confirmée, le lieu non plus : ne pas citer Saint-Quentin-en-Yvelines pour 2027) |
| 2 | Positionnement : « course à obstacles en boucles », variante du backyard ultra. Le terme « backyard » reste secondaire. Ne pas écrire « la seule » ni « la première en France » sans source vérifiée |
| 3 | Chiffre public : « plus de 300 participants » |
| 4 | Robots IA : autoriser les robots de réponse et de recherche, refuser les robots d'entraînement (`robots.ts`). Compromis : les modèles futurs apprendront moins sur Overbound ; les réponses en direct restent alimentées. `robots.txt` est indicatif, pas contraignant |
| 5 | `/cgv`, `/cgu` : laissées indexables |
| 6 | Version anglaise : reportée (cible Paris) |

## 5 bis. Avancement
- **Lot A** : fait dans le code, non commité (page `/events`, métadonnées evergreen, JSON-LD d'état effectif, lien header, `robots.ts`).
- **Lot B** : fait dans le code, non commité. Source unique des faits dans `src/lib/seo/siteFacts.ts` (dont la fenêtre « entre avril et juin 2027 » :
  un seul endroit à changer à l'annonce). Trois pages piliers (`/course-a-obstacles-paris`, `/course-a-obstacles-en-boucles`,
  `/overbound-en-bref`) avec réponse en tête de 40 à 60 mots, tableau de faits, FAQ, JSON-LD `WebPage` + `BreadcrumbList` + `FAQPage`,
  ajoutées au sitemap. Bloc de faits dans le HTML de l'accueil. Titres `/volunteers` et `/bootcamps` revus (sans « 2026 »).
  `/races/[id]` : déjà en `noindex`, la règle « 1h par tour » n'existe plus dans le code, rien à fusionner.
  Liste d'attente `/events` couverte par des tests (route + formulaire).
- **Lot C** : fait dans le code, non commité. `/llms.txt` et `/llms-full.txt` (`src/lib/seo/llmsTxt.ts`, alimentés par `siteFacts` et les
  piliers). JSON-LD centralisé dans `src/lib/seo/structuredData.ts` : `SportsOrganization` (`@id`, `contactPoint`, texte evergreen sans
  « première course » ni « 2026 »), `WebSite`, `BreadcrumbList` (pages piliers et événements), `SportsEvent` (région, `geo` si
  latitude/longitude en base, organisateur par `@id`). Non fait faute de source fiable : `legalName`, `foundingDate`, `founder`
  (entité juridique à confirmer), `endDate` (pas de colonne), `VideoObject` (pas d'URL publique du trailer), `sameAs` Finishers et
  Miles Republic (URLs à fournir).
  **Fiches tierces, action humaine** : corriger Finishers, Miles Republic, werun.world et la fiche Google Business Profile avec les
  mêmes faits que `/overbound-en-bref` (nom, format en boucles de 2 km, OPEN/RANKED, lieu et participants 2026, prochaine fenêtre
  « entre avril et juin 2027 », sans date ni lieu 2027), puis fournir les URLs pour `sameAs`.
- **Complément lot C** : `legalName` (Palvadeau Organisation) et `founder` lus dans `COMPANY_INFO`. `foundingDate` reste absent : aucune
  date de création dans le dépôt, ne pas l'inventer. `endDate` : migration `20261026120000_events_end_date.sql` (colonne nullable
  `events.end_date`, **à appliquer à la main après relecture**, puis à renseigner par SQL ou formulaire admin). `VideoObject` du
  teaser sur `/overbound-en-bref`, avec lecteur `<video>` visible (règle Google : la vidéo doit être sur la page). `uploadDate`
  fixé au 2026-10-26 (date du fichier), à corriger si la date de publication réelle diffère. Fiches tierces 2026 : `sameAs` du
  `SportsEvent` de l'édition 2026 et section Optional de `llms.txt`.
- **Lot D** : fait dans le code, non commité. `resolveNextEdition` (`src/lib/seo/nextEdition.ts`) : dès qu'un événement
  `announced` ou `on_sale` à date future existe en base, accueil, piliers, `llms.txt`, `llms-full.txt` et métadonnées racine passent de
  « entre avril et juin 2027 » à « le <date> » + lieu, sans déploiement (revalidation 60 s à 1 h). Sinon repli sur la fenêtre.
  Piège : tout événement non brouillon futur est publié ainsi (un événement de test `on_sale` serait affiché comme vraie édition).
- Lot E : à faire (processus, pas du code).

## 6. Vérification prévue
```bash
npx tsc --noEmit
npm run test
npm run lint
npm run build
```
Puis : validation du JSON-LD (Rich Results Test), contrôle du rendu `/events`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`
sur une préversion, et inspection d'URL dans Search Console après déploiement.
