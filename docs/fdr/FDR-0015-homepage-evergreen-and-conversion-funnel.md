# FDR-0015 — Accueil evergreen, page événement générique et arbitrage des popups

- **Statut** : Proposed — aucune ligne de code livrée à ce stade, seule cette FDR existe
- **Date** : 2026-09-27
- **Owner produit** : Florian Palvadeau
- **Owner technique** : à désigner
- **Périmètre** : refonte UX/UI de l'accueil et de la page événement pour maximiser la conversion,
  passage de l'accueil en contenu générique indépendant de l'édition, mise en ligne de trois pages
  actuellement mortes, correction du header et de l'image de partage, extension du Lucky Wheel à
  tout le site avec arbitrage anti-superposition des popups, contrat de responsive vérifiable, et
  réduction différée du tunnel d'inscription (itération 2)
- **Dépendances** : [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md) (format OPEN/RANKED),
  [FDR-0012](./FDR-0012-user-selected-open-wave.md) (choix du SAS par distance),
  [FDR-0013](./FDR-0013-ticket-scoped-departure-waves.md) (SAS par billet, confirme que le nom du
  billet ne doit jamais porter de décision opérationnelle), [FDR-0014-lucky-wheel](./FDR-0014-lucky-wheel.md),
  [FDR-0009](./FDR-0009-maintainability-refactor.md) (règles de migration, jamais d'app manuelle sans
  relecture)
- **Référence source** : cette FDR restitue par écrit un plan produit dans une session Claude Code du
  2026-09-27, pour qu'une session ultérieure (agent ou humain) puisse reprendre le travail sans avoir
  vécu la conversation d'origine. Tout ce qui suit a été vérifié en lisant le code réel du dépôt à
  cette date, pas déduit de la documentation produit historique.

---

## 0. Guide de reprise pour un agent

Cette FDR décrit un chantier large, volontairement découpé en tronçons indépendants (section 4 à 10).
Un agent qui reprend une partie doit :

1. **Revérifier les faits avant d'agir.** Le code bouge vite sur ce dépôt (voir FDR-0014, Lucky Wheel,
   mergé la veille de l'écriture de cette FDR sans que le contexte produit n'en tienne compte au
   premier passage). Chaque référence `fichier:ligne` ci-dessous doit être relue en repartant du
   fichier réel avant modification — ne jamais supposer qu'une ligne citée ici est toujours à la même
   position.
2. **Ne traiter qu'une section à la fois.** Les sections 4 à 10 sont pensées comme des PR séparées et
   review-ables indépendamment, dans l'esprit de FDR-0009 §7. Ne pas tenter de tout livrer en un seul
   changement.
3. **Ne jamais casser le tunnel de paiement en modifiant la page événement.** La section 5 touche à
   `src/app/events/[id]/page.tsx`, qui est aussi le point d'entrée du parcours de paiement. Le test de
   bout en bout Stripe (section 11, point 7) doit repasser après chaque changement sur ce fichier.
4. **L'itération 2 (section 10, tunnel d'inscription) ne démarre pas avant que l'itération 1 soit
   mesurée en production.** C'est une contrainte produit explicite, pas seulement un ordre de
   priorité technique.
5. **Toute migration SQL est écrite puis relue, jamais appliquée automatiquement.** Conformément à
   FDR-0009 : pas d'application en production sans relecture humaine et sans test sur un environnement
   séparé.

---

## 1. Contexte et preuve du problème

Six défauts mesurables ont motivé ce chantier, chacun vérifié dans le code au moment de l'écriture
(2026-09-27, après le merge `e90a167` du Lucky Wheel — voir §1 bis) :

1. **Les deux modes de jeu (OPEN et RANKED) ne sont jamais expliqués côte à côte sur `/`.** La seule
   mention vit dans une carte de `DistanceFormatsAndDifficulties.tsx:208-209`, chargée en
   `ssr: false` en bas de page, coupée en deux cartes qui ne se comparent pas. Le CTA
   « Découvrir le concept » mène à `/about/concept` (429 lignes), qui ne contient pas une seule fois
   les mots OPEN ou RANKED. Le meilleur explicatif du dépôt,
   `src/components/events/EventInfoSections.tsx:112-137`, n'est importé par aucun fichier — code mort.
2. **Le header ne mène à aucune course.** Zéro lien vers un événement dans `Header.tsx`. Le seul
   bouton primaire s'appelle « S'inscrire » et ouvre `/auth/register`, la création de compte, pas
   l'inscription à une course.
3. **Le prix apparaît en 9ᵉ position sur 10** dans la page événement (`UltraArenaPricing`), et
   l'accueil affiche 45/55/65/75 € en dur dans `PricingExplainer.tsx:7-36`, sans CTA et sans lecture
   des paliers réels stockés en base.
4. **L'accueil est écrit pour la première édition.** « Parce qu'il n'y a qu'une seule première
   fois. », « Le 12 septembre 2026, la première édition d'Overbound prendra vie… », « les premiers
   guerriers écriront l'histoire ». Chaque nouvelle édition imposerait une réécriture du code plutôt
   qu'un changement de données.
5. **Quatre pages rédigées sont inaccessibles.** `/events`, `/obstacles` et `/events/formats`
   répondent `notFound()` alors qu'environ 1750 lignes de contenu existent derrière (galerie
   d'obstacles avec recherche et filtres, comparatif de formats complet). `/races/[id]` est en ligne
   mais lié de nulle part, et affirme une règle fausse — « 1h par tour maximum » — qui contredit le
   30/25/20 minutes affiché partout ailleurs sur le format RANKED.
6. **L'image de partage social est cassée.** `/images/hero_header_poster.jpg` est référencé dans 9
   fichiers de métadonnées ; le fichier n'existe pas sur disque, seul un `.avif` du même nom est
   présent.

### 1 bis. Constats revérifiés le 2026-09-27 après le merge du Lucky Wheel (`e90a167`, PR #3)

Tous les points ci-dessus sont encore présents sur l'arbre de travail à cette date :

- composition de `src/app/page.tsx` inchangée ;
- `isUltraArena = params.id === 'ultra-arena-2026'` toujours en place
  (`src/app/events/[id]/page.tsx:69`) ;
- `notFound()` toujours actif sur `/events`, `/obstacles` et `events/formats/page.tsx:89` ;
- `/about/team` rend toujours `<div></div>` avec seulement des métadonnées ;
- `EventInfoSections` toujours importé par aucun fichier ;
- `UltraArenaValidationStrip` toujours importé (`page.tsx:23`) sans jamais être rendu ;
- `(event as any).gallery` toujours lu (`page.tsx:251-253`), colonne inexistante en base, retombe
  systématiquement sur une image unique ;
- 9 références à `hero_header_poster.jpg` pour un fichier absent (seul le `.avif` existe) ;
- tarifs 45/55/65/75 € toujours en dur (`PricingExplainer.tsx:7-36`) ;
- deux champs de distance toujours obligatoires dans le formulaire participant
  (`ParticipantForm.tsx:238,265`) ;
- `getSelectableWaveWindow` toujours dérivée de ces deux distances (`openSas.ts:186-197`) ;
- bouton primaire du header toujours « S'inscrire » vers `/auth/register`
  (`Header.tsx:358,479`).

Le merge du Lucky Wheel a en revanche introduit deux problèmes non identifiés au premier passage,
traités en §7.

### Résultat visé

Un visiteur comprend le concept et les deux modes de jeu en quelques scrolls, voit prix, date, lieu
et places restantes sans chercher, et l'accueil se maintient d'une édition à l'autre en changeant des
données en base plutôt que du code. La direction artistique ne change pas — palette, typographie,
photothèque et signature graphique (`mountain-vector.svg`) restent celles du site actuel.

---

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Architecture de l'accueil | Evergreen, avec un bloc « prochaine édition » alimenté par la base, pas de contenu figé à une édition |
| Média pour expliquer le concept | Schéma animé SVG **et** emplacement vidéo 30–60 s |
| Périmètre de l'itération 1 | Accueil + page événement + pages mortes + header + image de partage + Lucky Wheel global + contrat responsive |
| Tunnel d'inscription | Reporté en itération 2, après mesure de l'itération 1 |
| Exigence transverse | Mobile first et responsive vérifiable par machine, zéro défaut visuel sur toute taille d'écran, y compris les formats inhabituels |
| Lucky Wheel | Extension à tout le site (pas seulement la page événement), avec garde-fous contre la superposition avec d'autres popups |

---

## 3. Correction sur le tunnel — décision à confirmer avant l'itération 2

L'intention initiale était de ne garder que le choix du SAS et de supprimer les deux champs de
distance du formulaire participant. **Après lecture du code, cette suppression casserait une règle de
sécurité, pas seulement du confort.**

`getSelectableWaveWindow` (`src/lib/openSas.ts:186-197`) dérive la fenêtre de SAS autorisée des deux
distances déclarées par le participant :

| Distance idéale déclarée | Fenêtre de départ autorisée |
|---|---|
| ≥ 20 km | 12:00 → 13:30 |
| 10 à 19 km | 13:00 → 14:30 |
| < 10 km | 14:00 → 15:50 |

`getLatestAllowed` applique en plus un plafond dérivé de la distance minimale, et la fenêtre finale
proposée au participant est l'intersection des deux calculs. Sans ces valeurs, un participant visant
30 km pourrait choisir un départ à 15:50 et ne jamais avoir le temps de finir avant la fermeture du
parcours.

### Remplacement proposé

Un seul sélecteur à trois choix, formulé en tours plutôt qu'en kilomètres puisque la boucle fait
environ 2 km, remplace les deux champs numériques :

| Choix proposé au participant | Mappé en interne sur |
|---|---|
| « 1 à 4 tours, je découvre » | distance idéale 8 km, distance minimale 4 km |
| « 5 à 9 tours, j'ai un objectif » | distance idéale 14 km, distance minimale 10 km |
| « 10 tours et plus, je vise loin » | distance idéale 24 km, distance minimale 20 km |

Effet : les champs obligatoires du tunnel passent de 15 à 14, la question à laquelle un débutant ne
sait pas répondre disparaît, et la contrainte de sécurité de FDR-0012 reste intacte puisque le mapping
alimente exactement les mêmes fonctions qu'aujourd'hui.

---

## 4. Nouvelle architecture de l'accueil

`src/app/page.tsx` passe de 10 à 9 sections, réordonnées selon les questions réelles d'un visiteur
plutôt que selon l'historique d'écriture de la page.

| # | Section | Composant | Statut |
|---|---|---|---|
| 1 | Hero + barre événement | `HeroHeader` modifié + `FeaturedEventBar` nouveau | Le hero garde sa vidéo, sa bande partenaires et sa H1. Une barre est ajoutée dessous, lisant l'événement vedette : titre, date, lieu, « dès X € », places restantes, CTA primaire vers son inscription, CTA secondaire « Comprendre en 40 s » |
| 2 | Le concept en 3 temps | `ConceptExplainer` nouveau | Schéma SVG animé au scroll : une boucle d'environ 2 km, les obstacles dessus, la répétition des tours. Emplacement vidéo avec poster et lecture au clic, jamais en autoplay |
| 3 | Les deux modes de jeu | `FormatsComparison` nouveau, partagé | Extrait de `UltraArenaFormats.tsx` pour être réutilisé par l'accueil, la page événement et `/events/formats`. Deux cartes, « c'est pour toi si », CTA vers l'inscription avec le bon billet préselectionné |
| 4 | Les obstacles | `ObstaclesOverview` modifié | Alimenté par `/api/obstacles` au lieu des courses de l'événement vedette uniquement, donc jamais vide. Garde l'encart « variante ajustée » et gagne un lien vers la galerie `/obstacles` |
| 5 | Preuve sociale | `SocialProof` modifié | Remonté de la 7ᵉ à la 5ᵉ place. Corrige l'îlot clair `bg-linear-to-b from-gray-50 to-white` (`SocialProof.tsx:355`), qui casse le thème sombre du reste du site |
| 6 | Tarifs | `PricingExplainer` réécrit | Lit les paliers réels via `getPriceTiersForTimeline`, `getCurrentTicketPrice`, `getNextPriceChange` (`src/lib/pricing.ts`) et réutilise `PricingTimeline` (`src/components/events/PricingTimeline.tsx`). Gagne le CTA qui manque actuellement |
| 7 | FAQ | `FAQ` inchangé | Contenu Sanity, catégorie `general`. Ajouter la question OPEN/RANKED côté contenu éditorial |
| 8 | CTA final | `CTA` modifié | Copie factuelle (places restantes réelles, date de fin de palier réelle) à la place de « Places limitées. Ne tarde pas. » |
| 9 | Bénévoles | `VolunteersAppeal` inchangé | Audience différente, dernière place correcte |

Supprimés : `NextEvents` (son contenu part dans le hero et les tarifs) et
`DistanceFormatsAndDifficulties` (absorbé par les sections 2 et 3, y compris son `FormatCard` mort et
son fond d'image Unsplash hors allowlist).

### Table de reprise du contenu existant, pour ne rien perdre

| Contenu actuel | Où il atterrit |
|---|---|
| « la première organisation OCR au monde où tu choisis ton niveau de défi sur le même parcours » (`WhatsOverbound.tsx:25`) | Section 2, accroche du concept |
| « Notre mot d'ordre : dépassement de soi. » | Section 2 |
| Boucle de 2 km, 10+ obstacles, tours illimités (`NextEvents.tsx:61`) | Section 2, schéma et légendes |
| Chronos 30/25/20 et règle RANKED (`DistanceFormatsAndDifficulties.tsx:208`) | Section 3, carte RANKED, lue depuis une constante partagée (§9) |
| « Le format OPEN te permet de courir sans limite de temps » | Section 3, carte OPEN |
| « Accessible à tous, exigeant pour chacun » et ses 4 étapes | Fondu dans les sections 2 et 3 |
| Paliers 45/55/65/75 € | Section 6, lus depuis la base |
| « Adapté aux femmes : variante ajustée » (`ObstaclesOverview.tsx:74`) | Section 4, inchangé |
| Date, lieu, « 12 septembre 2026 » | Section 1, depuis `events.date` et `events.location`, jamais en dur |
| Bloc « en chiffres » commenté (`SocialProof.tsx:402-430`) | Section 5, réactivé avec des valeurs sourcées, ou supprimé si aucune source fiable n'existe |

**Point ouvert à trancher au moment de l'écriture** : la mention « Déjà 50+ avis positifs récoltés ! »
(`HeroHeader.tsx:90`) n'a aucune source dans le code. Soit elle devient dérivée d'une donnée réelle
(nombre de témoignages, nombre d'avis vérifiés), soit elle reste une affirmation éditoriale assumée —
mais ce choix doit être explicite, pas silencieux.

---

## 5. Page événement générique

Fichier principal : `src/app/events/[id]/page.tsx`.

1. **Supprimer le verrou de slug.** `isUltraArena = params.id === 'ultra-arena-2026'` (`page.tsx:60`)
   devient une détection de capacités : la section formats s'affiche si l'événement a des billets des
   deux formats, la galerie s'affiche si des images existent, etc. C'est le changement qui rend le
   site utilisable pour une seconde édition sans toucher au code.
2. **Renommer** `src/components/events/ultra-arena/` en `src/components/events/landing/` par
   `git mv`, puisque les composants ne sont plus spécifiques à un événement nommé. Changement
   mécanique, sans effet fonctionnel.
3. **Remonter le prix.** Ajouter « dès X € » à la rangée de faits du hero (`UltraArenaHero.tsx:119`,
   qui porte déjà Date, Lieu, Formats) et déplacer la section tarifs de la 9ᵉ à la 4ᵉ place. Nouvel
   ordre de la page : Hero, WhyDifferent, Formats, Tarifs, Projection, Témoignages, ComeTogether,
   Obstacles, Infos pratiques, FAQ.
4. **Dé-câbler les littéraux d'édition.** L'eyebrow `"Ultra Arena 2026"`
   (`UltraArenaHero.tsx:85`, `UltraArenaEventOver.tsx:57`) devient `event.title`. L'URL photos
   `https://photo.capture-ai.fr/events/overbound-2026` (`UltraArenaEventOver.tsx:76` et
   `Header.tsx:205`) vient d'une nouvelle colonne, voir §9.
5. **Rareté factuelle plutôt qu'incitative.** Brancher `UltraArenaValidationStrip.tsx`, aujourd'hui
   importé (`page.tsx:23`) mais jamais rendu, sur les places réellement restantes que l'API renvoie
   déjà (`api/events/[id]/route.ts:60-64`), et le rendre une fois sous le hero avec une formulation
   neutre plutôt qu'une injonction du type « Ne tarde pas ».
6. **Galerie.** Remplacer le cast `(event as any).gallery` (`page.tsx:243`), qui lit une colonne
   inexistante en base et retombe systématiquement sur une image unique, par `race.gallery_images`,
   qui existe déjà en base (`src/types/Race.ts`).
7. **Analytics.** Retirer le verrou `isUltraArena` dans
   `src/hooks/events/useEventAnalytics.ts:90,103,138,147` pour que toute page événement soit mesurée,
   pas seulement l'événement historique.
8. **Lucky Wheel.** `LuckyWheelWidget` est aujourd'hui monté deux fois dans le fichier, une fois par
   branche (`page.tsx:504` et `page.tsx:621`). Les deux montages disparaissent : le widget passe dans
   `Layout.tsx` pour couvrir tout le site, voir §7.

---

## 6. Pages mortes à remettre en ligne

| Route | Action |
|---|---|
| `/obstacles` | `page.tsx` appelle `notFound()` et n'importe même pas son propre contenu. Importer et rendre le composant déjà écrit dans `_page-content.tsx` (500 lignes, galerie avec recherche et filtres). Décommenter le lien correspondant dans `Footer.tsx:12` |
| `/events/formats` | Retirer le `notFound()` de `page.tsx:89`. Reconstruire la page autour du `FormatsComparison` partagé (§4, §9) et extraire le tableau comparatif dans `src/components/events/FormatComparisonTable.tsx`, en supprimant les deux copies inline aujourd'hui dupliquées dans `races/[id]/page.tsx:727-787` et `events/formats/page.tsx:246-583`. Décommenter `Footer.tsx:11` |
| `/races/[id]` | Corriger la règle fausse « 1h par tour maximum » (`page.tsx:377,389`) en la faisant lire depuis la constante partagée (§9), retirer le tableau dupliqué, et lier la page depuis la section formats. Sa vérification actuelle de slug `'ultra-arena'` (`page.tsx:144`) ne correspond à aucun slug réellement utilisé |
| `/about/team` | Rend `<div></div>` avec seulement des métadonnées, liée de nulle part dans le site. Supprimer la route pour ne pas laisser une page vide indexable par les moteurs de recherche |
| `/events` | Explicitement hors périmètre de cette FDR. Reste en `notFound()` jusqu'à ce qu'un second événement existe réellement, ce qui rendra un catalogue pertinent |

---

## 7. Lucky Wheel sur tout le site, et arbitrage des popups

Cette section couvre les deux problèmes introduits par le merge `e90a167` (PR #3, Lucky Wheel) et non
identifiés lors du premier passage d'exploration de cette FDR.

### 7.1 La roue peut devenir globale sans migration

Le schéma existant le permet déjà. `lucky_wheel_campaigns` n'est pas liée à un événement en dur : le
rattachement passe par la table de jonction `lucky_wheel_campaign_events (campaign_id, event_id)`
(`supabase/migrations/20260920190000_lucky_wheel_schema.sql:38-42`), donc une campagne cible déjà
plusieurs événements simultanément. La seule contrainte dure est
`lucky_wheel_entries.event_id NOT NULL` (`:84`) : chaque participation à la roue doit nommer un
événement, même quand le visiteur ne se trouve pas sur une page événement.

Il suffit donc de résoudre l'événement à afficher depuis le contexte de la page, sans aucune
migration :

| Page visitée | Événement résolu pour la roue |
|---|---|
| `/events/[slug]` | l'événement de la page |
| `/`, `/blog`, `/about/*`, toute autre page | l'événement vedette, via `src/lib/events/featuredEvent.ts` (§9, déjà prévu pour l'accueil) |
| Aucun événement vedette disponible | le widget ne rend rien — comportement déjà géré par le `campaign: null` que renvoie l'API publique |

Le widget quitte donc `events/[id]/page.tsx:504,621` et rejoint `Layout.tsx`, à côté de
`PopupPromotion`, avec un résolveur d'événement contextuel. Propriété utile du modèle existant : un
administrateur qui veut la roue sur tout le site n'a qu'à rattacher sa campagne à l'événement vedette,
et elle apparaît sur toutes les pages puisque toutes résolvent vers lui. La table
`lucky_wheel_campaign_events` continue de décider sur quels événements la roue a le droit de
s'afficher.

### 7.2 Bug latent découvert en lisant le code de résolution de campagne

`getActiveCampaignForEvent` (`src/lib/luckyWheel/campaign.ts:72-83`) fait
`.limit(1).maybeSingle()` **sans `order by`**. Si deux campagnes sont actives sur le même événement au
même moment — configuration qu'aucune contrainte n'empêche aujourd'hui —, la sélection devient non
déterministe : Postgres peut renvoyer l'une ou l'autre d'une requête à la suivante, sans qu'aucun code
applicatif ne le décide.

Correction en deux temps :

1. Un tri explicite par `starts_at` décroissant dans la requête, pour que la campagne la plus
   récemment démarrée gagne de façon prévisible.
2. Le garde-fou d'écriture décrit en 7.3, pour que la situation à deux campagnes actives simultanées
   sur le même événement ne se produise plus silencieusement.

### 7.3 Trois couches de garde contre les entrecroisements de popups

Deux popups peuvent aujourd'hui s'ouvrir automatiquement sur la même page sans se connaître l'un
l'autre : `PopupPromotion` (global, monté dans `Layout.tsx:123`, déclenché par un délai) et
`LuckyWheelWidget` (déclenché par délai, pourcentage de scroll ou intention de sortie, via
`trigger_rules`). Rien n'empêche aujourd'hui les deux de s'afficher dans la même session — ce qui va
directement à l'encontre de l'exigence produit de ne jamais être agressif envers le visiteur.

**Couche 1 — arbitre à l'exécution.** Un `PopupArbiterProvider` dans `Layout.tsx`, auprès duquel
`PopupPromotion` et `LuckyWheelWidget` demandent un créneau d'affichage. Le premier composant dont le
déclencheur se satisfait obtient le créneau ; l'autre se retire pour le reste de la session. Priorité
donnée à la roue, qui est un mécanisme de capture plus fort que la simple bannière promotionnelle.
Mémorisation en `sessionStorage`, sur le même principe que celui déjà utilisé par `PopupPromotion`.
Résultat garanti : un seul popup automatique par session, jamais deux superposés.

**Couche 2 — avertissement admin à l'écriture.** Dans `api/admin/lucky-wheel/campaigns/route.ts`,
détecter au moment d'activer une campagne les chevauchements de fenêtre `[starts_at, ends_at]` avec
une autre campagne active ou avec une promotion de type popup active sur un événement partagé.
Renvoyer un **avertissement, pas un refus** : l'administrateur peut légitimement vouloir configurer
les deux, puisque l'arbitre de la couche 1 n'en montrera jamais qu'un seul. Afficher cet avertissement
en clair dans `CampaignFormDialog.tsx`, en nommant explicitement l'objet en conflit et ses dates.

**Couche 3 — refus dur sur l'ambiguïté réelle.** Activer une seconde campagne dont la fenêtre
chevauche une campagne déjà active **sur le même événement** renvoie une erreur 409 nommant le
conflit. C'est le seul cas où le système ne peut pas raisonnablement choisir à la place de
l'administrateur, puisque c'est exactement le scénario qui rend `getActiveCampaignForEvent`
non déterministe (7.2).

Aucun des trois points de cette section ne nécessite de migration de schéma.

---

## 8. Header et image de partage

- `Header.tsx` : renommer le bouton primaire en « Créer un compte » pour refléter honnêtement sa
  destination, ajouter un CTA course distinct vers l'inscription de l'événement vedette, et ajouter
  des entrées de navigation vers l'événement, les formats et les obstacles. Appliquer le même
  traitement dans le menu mobile (`Header.tsx:383-502`).
- Le lien « photos édition 2026 » ne s'affiche que si l'événement vedette porte effectivement une
  URL de photos (voir la nouvelle colonne, §9).
- Faire pointer les 9 références à `/images/hero_header_poster.jpg` vers
  `/images/images/overbound-og-cover.jpg`, qui existe et sert déjà dans `src/app/layout.tsx:64`.
  Fichiers concernés : `about/faq/page.tsx`, `about/press/layout.tsx`, `blog/layout.tsx`,
  `blog/auteurs/page.tsx`, `blog/auteur/[slug]/page.tsx`, `blog/categories/page.tsx`,
  `blog/categorie/[slug]/page.tsx`, `contact/layout.tsx`, `components/seo/DynamicMetadata.tsx`.

---

## 9. Code partagé à créer

| Fichier | Rôle |
|---|---|
| `src/lib/events/featuredEvent.ts` | Sélection pure et testable du prochain événement à mettre en avant. Réutilise `getEffectiveEventStatus` et `isEventOpenForRegistration` (`src/lib/events/registrationStatus.ts`) |
| `src/app/api/events/featured/route.ts` | Renvoie l'événement vedette avec ses billets, ses paliers et ses places restantes. L'API de liste actuelle fait `select('*')` sans jointure ni tri (`api/events/route.ts:7`), donc insuffisante pour l'accueil |
| `src/constants/raceFormatRules.ts` | Les limites RANKED 30/25/20 minutes en un seul endroit, aujourd'hui retapées dans `UltraArenaFormats.tsx:125`, `UltraArenaFAQ.tsx:23` et `DistanceFormatsAndDifficulties.tsx:208` |
| `src/components/events/landing/FormatsComparison.tsx` | Le comparatif OPEN/RANKED partagé par l'accueil, la page événement et `/events/formats` |
| `src/components/homepage/ConceptExplainer.tsx` | Schéma SVG inline plus emplacement vidéo |
| `src/components/homepage/FeaturedEventBar.tsx` | Barre date, lieu, prix, places, CTA |
| `src/lib/shared/presentation/` | Y déposer le pill eyebrow et la carte glass, aujourd'hui retapés inline sur une quinzaine de sites différents |
| `src/components/popups/PopupArbiterProvider.tsx` | Le créneau unique de popup par session, consommé par `PopupPromotion` et `LuckyWheelWidget` |
| `src/lib/luckyWheel/campaignConflicts.ts` | Détection pure des chevauchements de campagnes et de promotions popup, testable sans base de données |
| `e2e/responsive.spec.ts` + `playwright.config.ts` | La matrice de fenêtres et ses assertions, voir §10 |

Règle applicable à tout code touché dans ce chantier : les couleurs passent par les tokens Tailwind
(`bg-primary`, `text-primary`), jamais par la valeur `#26AA26` en dur, présente 158 fois dans le
dépôt actuel. Ne pas ajouter de nouvelles variantes `dark:` : il n'existe aucun bloc `.dark` dans
`globals.css`, et les 108 variantes déjà présentes ne s'activent jamais.

### Base de données

Une seule migration pour ce chantier, à écrire dans `supabase/migrations/` et **à appliquer
manuellement après relecture**, conformément à FDR-0009 :

```sql
alter table public.events add column if not exists photos_url text;
```

Elle retire l'URL de galerie photos codée en dur de deux endroits (`UltraArenaEventOver.tsx:76` et
`Header.tsx:205`) et reste valable pour chaque édition future.

En parallèle, sans migration nécessaire : la colonne `tickets.race_format` existe déjà en base avec
une contrainte `open|ranked`, mais l'application ne la lit jamais. Ajouter le champ au type `Ticket`
(`src/types/Ticket.ts`), au `select` de `api/events/[id]/route.ts:23`, et faire lire cette colonne en
priorité par `isOpenFormatTicket` / `isRankedFormatTicket` (`src/lib/openSas.ts:111-119`), avec repli
sur la correspondance de nom uniquement si la colonne est nulle. Cette priorité rejoint la décision
déjà actée dans FDR-0013 : le nom d'un billet ou d'une course ne doit jamais porter de décision
opérationnelle. Le helper `isOpenFormatTicket` / `isRankedFormatTicket` reste le point d'entrée unique
exigé par `CLAUDE.md` — ne jamais réintroduire de vérification par ID ou par nom ailleurs dans le
code.

---

## 10. Contrat responsive, mobile first et vérifiable

Exigence produit explicite : zéro défaut visuel sur tous les types d'écrans, y compris les tailles
inhabituelles. Une intention de ce type ne se vérifie pas à l'œil sur toute nouvelle édition ; elle
devient donc un contrat mesuré par une machine. Six règles, chacune contrôlable automatiquement.

1. **Plancher à 320 px, plafond ouvert.** Aucun défilement horizontal entre 320 px et 3840 px de
   large. Aujourd'hui le préfixe `2xl:` n'est utilisé nulle part dans le dépôt, donc tout reste figé à
   l'apparence `xl` au-delà de 1536 px. Les nouveaux blocs reçoivent une largeur maximale de contenu
   explicite plutôt que de s'étirer indéfiniment sur un très grand écran.
2. **Typographie fluide.** Remplacer les sauts par palier du type `text-4xl md:text-7xl`
   (`HeroHeader.tsx:79`) par des `clamp()`, pour qu'aucune taille de texte ne casse entre deux points
   de rupture. Les titres en `font-black` reçoivent `text-balance` et `break-words` : en français, un
   mot composé long affiché en `text-4xl` déborde déjà à 320 px de large.
3. **Zones sûres iOS.** Les barres collantes utilisent aujourd'hui un simple `p-3`
   (`events/[id]/page.tsx:453`) et la barre de paiement un `border-t` sans marge basse
   (`RegistrationPaymentBar.tsx:37`). Les deux passent sous l'indicateur d'accueil des iPhone récents.
   Ajouter `env(safe-area-inset-bottom)` aux trois barres collantes et au bandeau de consentement
   cookies.
4. **Cibles tactiles de 44 px minimum.** La taille par défaut du composant `Button` est `h-9`, soit
   36 px (`src/components/ui/button.tsx:7`), sous le seuil tactile recommandé. Tous les CTA marketing
   et de tunnel passent en taille `lg` ou reçoivent un `min-h-11` explicite.
5. **Requêtes de conteneur pour les cartes.** Le comparatif des deux modes, les cartes d'obstacles et
   les cartes de billets se réorganisent selon leur propre largeur de conteneur, pas selon celle de la
   fenêtre entière. Un bloc à deux colonnes reste ainsi correct qu'il soit affiché en pleine largeur
   ou dans une colonne latérale plus étroite.
6. **Orientations et préférences oubliées.** Le paysage téléphone (par exemple 844 × 390) n'est traité
   nulle part dans le code actuel et casse les sections dimensionnées en pleine hauteur d'écran.
   `prefers-reduced-motion` n'est respecté par aucune animation maison : ni la vague animée des
   bénévoles, ni les bandeaux défilants, ni le futur schéma animé du concept.

### Harnais de vérification

Le dépôt ne dispose aujourd'hui que de `vitest` et `@testing-library/react`. Un test unitaire ne
prouve pas une mise en page. Ajouter **Playwright**, avec une matrice de fenêtres, pour transformer
l'exigence de « zéro défaut » en barrière rejouable à chaque édition future plutôt qu'en promesse
vérifiée une seule fois manuellement.

| Catégorie | Fenêtres testées |
|---|---|
| Téléphones | 320×568, 360×640, 375×667, 390×844, 414×896 |
| Paysage téléphone | 844×390 |
| Tablettes | 768×1024, 1024×768 |
| Bureau | 1280×800, 1440×900, 1920×1080, 2560×1440 |

Assertions appliquées sur chaque route clé (`/`, `/events/[slug]`, `/events/[slug]/register`,
`/obstacles`, `/events/formats`) :

- `document.scrollWidth <= document.clientWidth`, aucun défilement horizontal ;
- aucun élément ne dépasse la boîte de son parent direct ;
- tout élément interactif mesure au moins 44 px dans sa plus petite dimension ;
- une capture d'écran par fenêtre, pour comparaison visuelle d'une exécution à l'autre.

C'est la seule dépendance nouvelle introduite par cette FDR, et elle se justifie : elle attrape les
régressions de mise en page à chaque édition future, là où une relecture manuelle ne le fera pas deux
fois de suite avec la même rigueur.

---

## 11. Itération 2 — tunnel d'inscription

À ne démarrer qu'après mesure de l'itération 1 en production (contrainte produit explicite, voir §0).

1. Remplacer les deux champs de distance de `ParticipantForm.tsx:232-274` par le sélecteur à trois
   choix décrit en §3, avec un mapping pur et testé vers les couples ideal/min attendus par
   `getSelectableWaveWindow`.
2. Corriger la remise à zéro silencieuse du SAS choisi quand une distance change
   (`src/hooks/registration/useParticipants.ts:81-87`).
3. Supprimer `licenseNumber`, présent dans le type et soumis à l'API (`types.ts:45`,
   `MultiStepEventRegistration.tsx:356`) alors qu'aucun champ de formulaire ne le remplit jamais.
4. Combler le trou de mesure analytics entre `add_to_cart` et `begin_checkout` : aujourd'hui le bloc
   participants, le choix de SAS, le code promo, les options et les quatre validations de
   confirmation ne remontent aucun événement.
5. Décider si les quatre sections aujourd'hui affichées sur un seul écran redeviennent des étapes
   réelles, `stepIndex` étant actuellement figé à 0 (`MultiStepEventRegistration.tsx:218`).

---

## 12. Tests

Conformément à `docs/quality/testing-strategy.md` : un test de succès et un test d'échec par unité de
logique nouvelle, au minimum.

- `src/lib/events/featuredEvent.test.ts` : choisit bien le prochain événement ouvert ; ne renvoie
  rien quand tous les événements sont passés ou en brouillon.
- `src/lib/openSas.test.ts` : `isOpenFormatTicket` lit `race_format` en priorité ; retombe sur la
  correspondance de nom quand la colonne est nulle ; ne confond jamais un nom contenant « open » avec
  un billet explicitement marqué `ranked` en base.
- Dérivation du prix d'accueil : prix courant et prochaine hausse correctement calculés ; absence de
  palier gérée sans provoquer d'erreur.
- `src/constants/raceFormatRules.ts` : le formatage des limites de temps par tour.
- `src/lib/luckyWheel/campaignConflicts.test.ts` : détecte un chevauchement sur un événement
  partagé ; ne signale rien pour deux campagnes portant sur des événements disjoints ; distingue
  correctement l'avertissement du refus dur.
- `getActiveCampaignForEvent` : renvoie la campagne la plus récemment démarrée quand deux campagnes
  sont actives simultanément, au lieu d'un choix non déterministe.
- L'arbitre de popup : le second demandeur ne reçoit jamais le créneau ; la roue passe devant la
  bannière promotionnelle quand les deux se déclenchent.
- Itération 2 : le mapping des trois choix vers les fenêtres de SAS, y compris le cas limite exact à
  20 km.

---

## 13. Vérification

```bash
npx tsc --noEmit
npm run test
npm run test:e2e   # nouvelle commande, matrice de fenêtres Playwright — à créer avec le harnais
npm run build
npm run dev
```

Puis, manuellement :

1. `/` à 375 px et en 1440 px : concept compris sans clic, deux modes de jeu lisibles côte à côte,
   prix et date visibles sans scroll profond.
2. Le prix affiché sur `/` correspond au palier actif en base. Changer un palier depuis l'admin,
   recharger, vérifier que la valeur affichée suit sans redéploiement.
3. `/events/{slug}` pour l'événement vedette, puis pour un second événement créé en brouillon avec un
   seul format, pour confirmer que la composition de la page s'adapte sans verrou de slug.
4. `/obstacles` et `/events/formats` renvoient un statut 200 et s'affichent correctement.
5. Les deux CTA du header mènent bien respectivement à la création de compte et à l'inscription
   course, sans confusion possible pour le visiteur.
6. Inspection des métadonnées sur un déploiement de préversion (ou en local) pour confirmer que
   l'image de partage social résout correctement sur les pages concernées.
7. Le tunnel d'inscription complet aboutit à un paiement Stripe en mode test, pour prouver qu'aucune
   des modifications de la page événement n'a cassé le passage au paiement.
8. Une page avec à la fois une campagne Lucky Wheel active et une promotion de type popup active :
   une seule des deux s'ouvre, et la roue passe devant. Rejouer sur `/` puis sur `/events/[slug]`
   pour confirmer que la roue suit correctement le contexte de la page.
9. Tenter d'activer depuis l'admin une seconde campagne chevauchant la première sur le même
   événement : refus 409 nommant explicitement le conflit. Sur deux événements disjoints : simple
   avertissement affiché, création acceptée.
10. Sur un iPhone réel ou l'inspecteur d'appareil d'un navigateur, vérifier que les trois barres
    collantes ne passent pas sous l'indicateur d'accueil, et que rien ne déborde à 320 px de large ni
    en orientation paysage sur téléphone.

---

## 14. Hors périmètre de cette FDR

- Nettoyage global des 158 occurrences de `#26AA26` en dur et des 108 variantes `dark:` inertes dans
  le reste du dépôt, en dehors des fichiers effectivement touchés par ce chantier.
- Revitalisation de `/events` comme catalogue multi-événements, à faire quand un second événement
  existera réellement et rendra un catalogue pertinent.
- Refactoring de `races/[id]/page.tsx` au-delà de la correction de la règle fausse et de la
  suppression du tableau dupliqué.
- Le consent mode dégradé pour Meta et Google (chargement des pixels avant consentement explicite),
  qui demande un arbitrage marketing séparé — voir FDR-0009 §5.1.
