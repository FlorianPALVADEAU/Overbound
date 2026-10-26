# Design system Overbound

Source de vérité pour toute UI du site public. **À lire avant d'écrire ou de modifier un composant
visuel**, au même titre que `docs/guides/email-conventions.md` pour les emails.

- Décision technique : [ADR-0005](../adr/ADR-0005-design-system.md)
- Référence vivante : route `/design` (local et preview Vercel, 404 en production)
- Code : tokens dans `src/app/globals.css`, primitives dans `src/components/ds/`, variants dans
  `src/components/ui/button.tsx` et `src/components/ui/card.tsx`
- Garde-fou : `npm run lint:design` (inclus dans `npm run lint`)

## Principes

1. **Sombre par défaut, une seule couleur d'action.** Le fond est `#141414`, le vert `primary` porte
   toutes les actions. Le rouge `signal` est l'unique exception (voir Couleurs).
2. **Le rythme vient des bandes.** Une page est une suite de `Section` pleine largeur qui alternent
   les tons. Jamais de fond posé au hasard sur une `<section>` inline.
3. **Un titre fort = la police display.** Titres et chiffres en police condensée, uppercase. Le corps
   reste en Geist.
4. **Des échelles fermées.** Tailles, espacements, largeurs, rayons : on choisit dans une liste, on
   n'invente pas de valeur arbitraire `[…]`.
5. **Mobile first.** Tout fonctionne de 320 px à 3840 px (contrat FDR-0015 §10).

## Recette d'une page marketing

```tsx
import { Container, Section, SectionHeader } from '@/components/ds'
import { Button } from '@/components/ui/button'

<PageHero … />                                   // ou EventHero pour un événement
<Section>                                        // tone="default", spacing="default"
  <Container>
    <SectionHeader eyebrow="Le concept" title="Une boucle, tes règles" lead="…" />
    <div className="grid gap-4 sm:gap-6 md:grid-cols-3">…cartes…</div>
  </Container>
</Section>
<Section tone="light" edge="mountain">…</Section> // bande claire, signature montagne
<Section backgroundSrc="/images/…">…</Section>    // bande photo
<Section tone="deep" spacing="spacious" className="border-t border-primary/40">
  <Container className="text-center">…<Button size="hero">Je prends ma place</Button></Container>
</Section>
```

Alternance conseillée : `default` → `light` (angled ou mountain) → photo → `default` → `deep` en
dernier pour le CTA final. Jamais deux bandes `light` ou deux bandes photo de suite.

## Je veux… j'utilise…

| Besoin | Utiliser | Ne pas faire |
|---|---|---|
| Une section | `<Section tone spacing edge>` | `<section className="py-14 bg-neutral-950">` |
| Largeur du contenu | `<Container size="page \| prose \| form">` ou `containerClass()` | `max-w-6xl mx-auto px-6` |
| Titre de section | `<SectionHeader eyebrow title lead />` | `h2` stylé à la main |
| Titre de page | `<PageHero>` ou `<SectionHeader as="h1">` | `text-4xl font-black` |
| Titre de carte | `className={cn(DISPLAY_TITLE, 'text-title')}` | `text-lg font-bold` |
| Petit label au-dessus d'un titre | `<Eyebrow>` (`text`, `pill`, `pill-soft`) | `text-xs tracking-[0.3em] …` |
| Tag inclus / non inclus, chip sur photo | `<Pill variant="tag \| tag-muted \| glass">` | pill inline |
| Statut dans un tableau admin | `Badge` shadcn | `Pill` |
| Chiffres clés (date, prix, places) | `<StatRow stats={[…]} />` | grille de `dt/dd` inline |
| Carte | `<Card variant="default \| feature \| info \| glass \| photo">` | `rounded-3xl bg-white/5 …` inline |
| Bouton marketing | `<Button size="cta">` | `size="lg" className="h-12 rounded-xl px-8"` |
| CTA du hero / CTA final | `<Button size="hero">` | `h-14 font-black` inline |
| Action secondaire sur photo | `<Button variant="outline-on-photo">` | `border-white/40 bg-transparent …` |
| CTA d'inscription du header | `<Button variant="signal">` | `bg-red-600` |
| Erreur, suppression | `variant="destructive"`, `text-destructive` | `text-red-500`, `signal` |

## Typographie

Familles :
- `font-display` : police condensée (Barlow Condensed, graisse 700), **toujours** en uppercase. Pour
  titres, chiffres et CTA `hero`.
- `font-sans` (Geist) : tout le reste, graisses 400, 500, 600.

Échelle (tokens `@theme`, tailles fluides en `clamp()`, interligne et tracking inclus dans le token) :

| Classe | Taille | Usage |
|---|---|---|
| `text-display-xl` | 44 → 136 px | H1 du hero événement |
| `text-display-lg` | 36 → 72 px | H1 de page |
| `text-display-md` | 30 → 48 px | H2 de section |
| `text-title` | 20 → 24 px | H3 de carte |
| `text-lead` | 16 → 18 px | chapeau sous un titre |
| `text-base` / `text-sm` | 16 / 14 px | corps |
| `text-xs` | 12 px | mentions, aides de formulaire |
| `text-eyebrow` | 12 px, tracking 0.24em | eyebrow, uppercase |
| `text-label` | 11 px, tracking 0.2em | label de chiffre ou de tag, uppercase. Seule taille sous 12 px |

Règles :
- Les classes display s'utilisent via `DISPLAY_TITLE` (`font-display font-bold uppercase
  text-balance wrap-break-word`) ou via `SectionHeader`, jamais à moitié.
- `font-black` est interdit : un titre fort passe par `font-display`.
- Tracking autorisé : `tracking-tight`, `tracking-eyebrow`, `tracking-label` (ou celui du token).
  Aucun `tracking-[…]`.
- Aucune taille arbitraire `text-[11px]`, `text-[2.5rem]`… Si un besoin revient, on ajoute un token.

## Couleurs

Uniquement des tokens sémantiques. Aucune valeur hexadécimale dans une classe.

| Rôle | Token |
|---|---|
| Fond par défaut | `bg-background` (#141414) |
| Bande la plus sombre (CTA final, footer) | `bg-surface-deep` |
| Carte, panneau | `bg-card`, `bg-muted` |
| Texte principal | `text-foreground` |
| Texte secondaire, chapeau | `text-muted-foreground` |
| Label, légende | `text-subtle` |
| Action, accent | `primary` (vert) |
| CTA d'inscription du header uniquement | `signal` (rouge), au plus un par écran |
| Erreur | `destructive` |
| Statut réussi / attention / information (admin) | `success`, `warning`, `info` |
| Bordure | `border-border`, ou `border-primary/40` pour un séparateur de CTA |

Statuts : `text-success`, `bg-success/15`, `border-success/40` (idem `warning`, `info`, `destructive`). Le vert de marque `primary` reste réservé à l'action ; `success` est un vert distinct. Interdits dans l'admin : `text-emerald-*`, `bg-amber-*`, `text-rose-*`, `text-sky-*`... (règle `raw-status-color`).

Interdits : `#26AA26` et tout hex en classe, `text-gray-*`, `text-neutral-*`, `text-zinc-*`,
`text-slate-*`, `bg-neutral-950`, `bg-red-*`, et les variantes `dark:` (le site n'a qu'un thème).

Dans une `Section tone="light"`, les tokens sont remappés (`.tone-light`) : on garde exactement les
mêmes classes, elles deviennent claires toutes seules. Même principe pour `tone="primary"`.

## Espacements

- Échelle de `gap` et `space-y` : **1, 2, 3, 4, 6, 8, 12, 16** (multiples de 4 px). Pas de 1.5, 2.5,
  5, 7, 10, 14 dans le code marketing.
- Padding vertical des sections, uniquement via `Section spacing` :
  - `compact` : `py-12 sm:py-16`
  - `default` : `py-16 sm:py-20 lg:py-24`
  - `spacious` : `py-20 sm:py-28` (CTA final)
  - `none` : seulement si le contenu gère lui-même sa hauteur (hero plein écran)
- En-tête de section (géré par `SectionHeader`) : eyebrow → titre `mt-2`, titre → chapeau `mt-3`,
  en-tête → contenu `mb-10 sm:mb-12`, largeur `max-w-2xl`.
- Grilles : cartes `gap-4 sm:gap-6` ; layout deux colonnes `gap-12 lg:gap-16`.
- CTA sous un bloc : `mt-12`, boutons entre eux `gap-3`.

## Largeurs

Trois largeurs, toutes avec les mêmes marges `px-4 sm:px-6 lg:px-8` :

| `Container size` | Largeur | Pour |
|---|---|---|
| `page` (défaut) | `max-w-7xl` | toute section marketing |
| `prose` | `max-w-3xl` | blog, pages légales, texte long |
| `form` | `max-w-xl` | auth, compte, tunnel d'inscription |

Dans une section `page`, un bloc de texte se limite à `max-w-2xl` (en-tête) ou `max-w-3xl`.

## Formes, ombres, mouvement

- Rayons : cartes `rounded-2xl`, boutons et champs `rounded-xl`, pills `rounded-full`. Pas de
  `rounded-3xl` ni de `rounded-lg` sur le marketing.
- Ombres : `shadow-sm`, `shadow-lg`, et `shadow-glow` (halo vert) au survol des cartes. Pas de
  `shadow-[…]`.
- Mouvement : `duration-150`, `duration-200` ou `duration-300`, avec `ease-standard`. Toute animation
  maison doit s'arrêter sous `prefers-reduced-motion` (`motion-safe:` ou bloc dédié dans
  `globals.css`).

## Responsive et accessibilité

- Aucun défilement horizontal de 320 px à 3840 px (`npm run test:e2e`).
- Cibles tactiles d'au moins 44 px : boutons marketing en `size="cta"` ou `"hero"`. La taille
  `default` (36 px) est réservée à l'admin et aux outils denses.
- Barres collantes : `pb-[env(safe-area-inset-bottom)]`.
- Contraste : texte courant au minimum `text-muted-foreground` sur `background`. `text-subtle`
  uniquement pour les labels uppercase et les légendes.

## Garde-fou `lint:design`

`scripts/lint-design.mjs` compte, dans `src/app` et `src/components` (hors `ui/`, studio,
tests ; l'admin et `src/app/dashboard` sont inclus), les motifs interdits ci-dessus. Il fonctionne en **cliquet** contre
`scripts/design-baseline.json` :

- la migration est terminée : la baisse est enregistrée, la baseline ne contient plus que des
  **exceptions assumées** (aujourd'hui `Footer.tsx` : filigrane « OVERBOUND » en `font-black` et
  eyebrows à tracking large, voulus par le design d'origine) ;
- aucun compteur ne peut augmenter, aucun nouveau fichier ne peut introduire de violation ;
- `npm run lint:design:update` enregistre une baisse (refusé si un compteur augmente). Ajouter une
  exception demande une décision de design explicite, pas un contournement du lint.

Si le garde-fou bloque, on corrige le code avec les tokens et les primitives. On ne modifie pas la
baseline à la main pour faire passer une régression.

## Back-office (`/dashboard`)

Même système, densité d'outil. Aucune valeur locale : on assemble.

- **Cadre** : `AdminShell` (`src/components/admin/AdminShell.tsx`) = sidebar `bg-surface-deep` + barre haute
  (contexte événement) + zone de contenu `max-w-screen-2xl`, `space-y-8`. Il est monté une seule fois par
  `src/app/dashboard/layout.tsx` (et par l'hôte historique `?tab=`). Une page ou une section ne rend jamais
  son propre `<main>`.
- **Titre de page** : `AdminPageHeader` (`eyebrow` = domaine, `title`, `description`, `actions`). `as="h1"` par
  défaut, `as="h2"` pour un bloc dans une page. Eyebrows : Événements, Billetterie, Communauté,
  Communication, Système, Terrain.
- **Chiffres clés** : `StatRow`, pas de grille de `Card` avec `text-2xl font-bold`.
- **Panneaux** : `<Card variant="info">` (`rounded-2xl`). Champs et boutons gardent les valeurs shadcn
  (`size="default"` 36 px autorisé ici). Rayons : `rounded-xl` / `rounded-2xl`, jamais `rounded-lg`, `rounded-3xl`.
- **Labels** : `text-label font-semibold uppercase text-subtle`, pas de `tracking-wide`.
- **Graphiques** (recharts) : couleurs `var(--chart-1..5)` et `var(--primary)`, jamais d'hexadécimal.
- La règle `raw-status-color` de `lint:design` ne vaut que pour l'admin (`src/components/admin`, `src/app/dashboard`) et l'espace ambassadeur.

### Mobile (< `lg`)

L'écran d'un téléphone n'est pas un bureau réduit : on replie au lieu d'empiler.

- **`Disclosure`** (`@/components/ds`) : carte dont le corps est replié sous `lg` et toujours ouvert dès `lg`
  (CSS pur, pas de flash). `title`, `icon`, `badge` (visible replié), `summary` (une ligne sous le titre
  replié), `defaultOpen` pour ce qui appelle une action (récompense à réclamer). À utiliser pour tout bloc
  secondaire : graphiques, résumés, filtres lourds, classements, historiques.
- **`StatRow compact`** : cellules `p-3`, chiffres `text-2xl` (admin et mobile).
- **Listes de données** (`OperationsList`, réf. vivante dans `/design`) : on sacrifie. Sous `md`, pleine largeur,
  lignes zébrées (`even:bg-foreground/5`), et **trois lignes maximum** par donnée : titre (1re colonne) + menu ⋯ ;
  une ligne de résumé sans labels ; le reste est dans le détail, dépliable par le chevron. Chaque colonne
  déclare son rôle : `mobile: 'summary' | 'detail'` (sans déclaration : 2 colonnes de résumé, le reste en
  détail) et peut fournir `mobileCell` pour un rendu compact. Les cellules à deux lignes n'affichent que la
  première dans le résumé. Toutes les colonnes restent accessibles, y compris celles masquées par défaut.
  Recherche pleine largeur, puis `Filtres (n)` et actions sur une rangée ; pagination `1 / 3` en bas seulement.
- **Barre haute admin** : le sélecteur d'événement ne garde que le `select` et les deux raccourcis ; le détail
  (date, lieu, statut) apparaît dès `sm`.
- Un composant qui ne tient pas à 320 px a un rendu mobile distinct (`md:hidden` / `hidden md:block`), pas un
  `min-w-[…]` avec défilement horizontal.

## Images de couverture et de partage

- **Une seule source** : `src/constants/coverImages.ts`. `COVER` liste chaque emplacement (hero d'accueil, hero événement, bandeaux de page, bandes de la page événement, galerie). Remplacer une photo = changer son nom de fichier dans ce fichier, nulle part ailleurs. Ne jamais écrire un chemin `/images/...` en dur dans un composant de page.
- **Format** : webp qualité ~80, 1920 px de large, paysage de préférence (les portraits sont recadrés au centre ; régler `position` du `PageHero` si besoin). Photos dans `public/images/images` (événement, équipe) et `public/images/obstacles`.
- **Série à jour** : `obstacles/*`, `P1xxxxxx.webp` et `benevoles-*.webp`. Les autres fichiers de `images/images` sont l'ancienne série, à ne plus utiliser pour une couverture.
- **Image de partage (OG, Twitter)** : générée par la route `/og` (`src/app/og/route.tsx`), JPEG ~100 Ko avec photo, dégradé, logo, kicker et titre. Dans les métadonnées d'une page : `ogImageUrl({ title, kicker, photo })` (`src/lib/seo/ogImage.ts`). Photos autorisées : `OG_PHOTOS` dans `coverImages.ts`, des jpg 1200×630 dans `public/images/og/`. Pour une nouvelle photo, la convertir avec sharp (`resize(1200, 630, { fit: 'cover' })`, jpeg q80), la déposer dans `og/` et ajouter sa clé à `OG_PHOTOS`.
- **Email** : jpg/png uniquement, voir `docs/guides/email-conventions.md`.

## Texte long (blog, pages légales)

Le plugin typography n'est pas installé : les classes `prose` de Tailwind ne font rien. Le texte
long utilise `.prose-overbound` (`globals.css`), basée sur les tokens, avec `:where()` pour que les
classes utilitaires d'un élément gardent la priorité. Les pages légales partagent `LegalHeader`
(`src/components/legal/`).

## Faire évoluer le système

Un besoin non couvert (nouvelle taille, nouveau ton de bande, nouveau variant) s'ajoute **dans le
système** : token dans `globals.css`, variant dans la primitive, mise à jour de ce document et de la
page `/design`, dans la même PR. Jamais de valeur arbitraire locale « pour cette fois ».
