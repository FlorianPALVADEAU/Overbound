# Inventaire des images de couverture

État au 2026-10-26. Chaque ligne : page, composant, image actuelle, emplacement à remplacer.
Format cible des visuels : `.webp` (qualité ~80), 2400 px de large pour un bandeau, ratio paysage 16:9 à 21:9, sujet dans le tiers
central (le texte du hero se pose à gauche et en bas). Image de partage : `.jpg` 1200×630 (Outlook et les réseaux ne lisent pas le webp/avif).

## Bandeaux de page (`PageHero`)

| Page | Route | Fichier actuel | Source dans le code |
|---|---|---|---|
| Formats OPEN / RANKED | `/events/formats` | `images/lot-of-runner-going-everywhere-with-chains-on-their-necks.webp` | `src/app/events/formats/page.tsx` (`BG.hero`) |
| Formats, bande « parcours » | `/events/formats` | `images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.webp` | idem (`BG.journey`) |
| Obstacles | `/obstacles` | `images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.webp` | `src/app/obstacles/_page-content.tsx:93` |
| Bénévoles | `/volunteers` | `images/P1090801.webp` | `src/components/volunteers/VolunteerHero.tsx` |
| Bootcamps | `/bootcamps` | `obstacles/tire-flip.webp` | `src/app/bootcamps/BootcampsView.tsx:40` |
| Notre histoire | `/about/our-story` | `images/finish-line-2runners.webp` | `src/app/about/our-story/page.tsx:49` |
| FAQ | `/about/faq` | `images/a-group-of-friend-celebrating-after-a-race.webp` | `src/app/about/faq/FAQPageContent.tsx:106` |
| Partenaires et presse | `/about/partners` | `images/a-photograph-in-action.webp` | `src/app/about/partners/page.tsx:65` |
| Crédits | `/about/credits` | `images/overbound-headband-on-chains-with-grass-in-background.webp` | `src/app/about/credits/page.tsx:130` |
| Contact | `/contact` | `obstacles/tire-drag.webp` | `src/app/contact/page.tsx:22` |
| Blog | `/blog` | `images/an-armed-crossed-man-talking-in-a-middle-of-a-circle-of-people.webp` | `src/app/blog/page.tsx:110` |

## Accueil

| Emplacement | Fichier actuel | Source |
|---|---|---|
| Hero (affiche de la vidéo, 1920×1280) | `images/hero_header_poster.webp` (+ `.avif`) | `src/components/homepage/HeroHeader.tsx:82` |
| Hero (vidéo en boucle) | `videos/hero_header_video.mp4` / `.webm` | `HeroHeader.tsx:101` |
| Concept : 10 vignettes d'obstacles | `obstacles/*.webp` (balance-beam, barbels, chain-carry1, farmer-carry, log-carry1, monkey-bars, tire-drag, tire-flip, wall-over, wall-under) | `src/components/homepage/ConceptExplainer.tsx` |

## Page événement (`/events/[slug]`)

| Emplacement | Fichier actuel | Source |
|---|---|---|
| Hero | `events.image_url` en base, sinon `images/a-smiling-running-man-black-weared-sport.webp` | `src/components/events/landing/EventHero.tsx:66` |
| Bande « avantages » | `images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.webp` | `src/components/events/landing/backgrounds.ts` |
| Bande « infos pratiques » | `obstacles/barbels.webp` | idem |
| Galerie « projection » (4 photos) | `a-group-of-friends-celebrating-after-a-hard-obstacle`, `a-sunny-mood-with-runners-ready-to-go`, `a-wave-of-runners-…`, `a-young-men-carrying-two-wooden-logs-…-shouting-at-the-camera` | `src/components/events/landing/UltraArenaProjection.tsx` |

## Image de partage (WhatsApp, Instagram, Discover, LinkedIn)

| Fichier | Usage |
|---|---|
| `images/overbound-og-cover.jpg` (1200×630) | image par défaut, référencée par 23 fichiers (layout racine, métadonnées, pages piliers, JSON-LD, listes de pages) |
| `images/og-headband-chains.jpg`, `og-runners-wave.jpg`, `og-two-men-pride.jpg`, `og-tractor-tire.jpg`, `og-group-warmup.jpg`, `og-coach-warmup.jpg`, `og-barbed-wires.jpg` | variantes par page (crédits, histoire, bénévoles, obstacles, trainings…) |

## Hors sujet de la refonte mais visible
`images/hero_header_poster.*` sert aussi d'affiche pour le mode « mouvement réduit ». `events.image_url` se règle dans l'admin, sans code.

## Changer une image (2026-10-26)

- Toutes les photos de couverture passent par `src/constants/coverImages.ts` (`COVER`). Remplacer une photo = changer un nom de fichier dans ce fichier.
- Les images de partage sont générées par la route `/og` (`src/app/og/route.tsx`) : photo + dégradé + logo + titre, en JPEG ~100 Ko. Les photos autorisées sont listées dans `OG_PHOTOS` (jpg uniquement, clé en liste blanche). Un nouveau titre s'écrit avec `ogImageUrl({ title, kicker, photo })`.
- Série à jour (confirmé par Florian) : `obstacles/*`, `P1xxxxxx.webp`, `benevoles-5/24/47`. Les EXIF sont perdus, donc l'âge ne se lit pas dans les fichiers. Procédure complète : `docs/design/design-system.md`, section « Images de couverture et de partage ».

## Nettoyage (2026-10-26)

L'ancienne série de `public/images/images` est supprimée (130 fichiers, ~37 Mo). Restent : `P1*`, `benevoles-*`, les portraits d'équipe (`florian-and-sourath`, `osteopath-practicing*`) et deux jpg (`a-sunny-mood…`, `a-wave-of-runners…`) que des emails déjà envoyés référencent. Les tableaux ci-dessus décrivent l'état avant cette refonte ; l'état courant est dans `src/constants/coverImages.ts`.
La migration `20261026130000_replace_legacy_cover_images.sql` repointe 4 lignes de prod (3 bootcamps, 1 course) et doit être appliquée avant le déploiement.
