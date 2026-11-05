---
target: blog
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
target_identity: "file:/Users/florianpalvadeau/Projects/Overbound/src/app/blog/page.tsx"
target_fingerprint: "sha256:7d9fc063f995ff8568bb61becbfa63518dc3f80de68d0984503bba327c2919d1"
target_path: /Users/florianpalvadeau/Projects/Overbound/src/app/blog/page.tsx
timestamp: 2026-11-04T13-25-09Z
slug: src-app-blog-page-tsx
closed: true
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Sanity-outage fallback works; no loading skeleton |
| 2 | Match System / Real World | 3 | French copy, dates, reading time fine |
| 3 | User Control and Freedom | 3 | No "back to top" on long articles |
| 4 | Consistency and Standards | 1 | Banned raw Tailwind colors (emerald-500, amber-500) throughout post detail; zero ds primitives used |
| 5 | Error Prevention | 3 | Fetch failures caught gracefully on list and detail |
| 6 | Recognition Rather Than Recall | 3 | Breadcrumbs on post page; categories/auteurs lack hero consistency |
| 7 | Flexibility and Efficiency | n/a | Read-mode content surface, no power-user path expected |
| 8 | Aesthetic and Minimalist Design | 2 | Three competing accent systems (emerald/amber/primary) with no rule |
| 9 | Error Recovery | 2 | "Article introuvable" dumped with no style, no CTA home |
| 10 | Help and Documentation | n/a | Blog is the documentation itself |

Total: 20/32 — Acceptable (63%)

## Design Specificity Verdict

LLM assessment: Generic blog template bolted onto Overbound, not authored for it. No font-display/uppercase treatment, no Eyebrow/Pill/Card/Section primitives anywhere except the index hero (via PageHero). categories, auteurs, auteur/[slug] each hand-roll their own non-conformant hero instead of reusing PageHero. Rest of site has strict dark/green/display-font identity; blog quietly opts out.

Deterministic scan: impeccable detect --json on src/app/blog, src/components/blog, src/components/hero/PageHero.tsx — all exit 0, empty findings. Detector's ruleset did not catch the raw color violations A found (gap in detector coverage, not a false positive).

Visual overlays: not available. No browser automation tool exposed this session — skipped, not faked.

## Overall Impression

Data layer and SEO plumbing (JSON-LD, graceful Sanity degradation, breadcrumbs) are solid. Visual layer ignores the design system almost entirely on every page except the blog index hero.

## What's Working

1. Resilient data layer — every page catches Sanity failures, shows explicit fallback instead of crashing.
2. Clean index-page filtering/pagination — one-line search + category select, clear-filter link, sensible labels.
3. Breadcrumbs + structured data on post detail — real SEO investment independent of visual polish.

## Priority Issues

[P0] Banned raw Tailwind status colors in src/app/blog/post/[slug]/page.tsx
Why it matters: border-emerald-500/70, border-amber-500/80, bg-amber-500/10 are explicitly banned by docs/design/design-system.md.
Fix: map accent prop to tokens — default -> border-primary/70/bg-primary/10, "orange" -> border-warning/80/bg-warning/10, "neutral" -> border-border/bg-muted.

[P0] Zero use of font-display/DISPLAY_TITLE typography system across blog
Why it matters: every H1/H2 in blog uses text-3xl font-bold instead of site's display tokens. categories, categorie/[slug], auteurs, auteur/[slug] bypass PageHero entirely.
Fix: route all four pages through PageHero like blog index already does; apply DISPLAY_TITLE/text-display-md to post H1 and H2s.

[P1] <img> instead of next/image for all CMS content images
Why it matters: no responsive srcset, no lazy-loading, CLS risk on mobile — contradicts FDR-0015.
Fix: swap to next/image with explicit dimensions or fill+sizes.

[P1] BlogFilters/BlogArticleItem bypass all ds primitives
Why it matters: hand-rolled card/input/button styling means future token changes silently miss the blog.
Fix: rebuild BlogArticleItem on <Card variant="default">; swap filter buttons for <Button> variants.

[P2] Inconsistent spacing/rhythm, no Section wrapping
Why it matters: blog index uses raw containerClass() + py-16; categories/auteurs reinvent their own vertical rhythm.
Fix: standardize on Section spacing="default" wrapping.

## Persona Red Flags

Jordan (confused first-timer): lands on a post via search, sees amber vs emerald highlight boxes with no legend — may misread amber as a warning signal. Nothing ties the post page back to "this is Overbound" beyond a small logo.

Casey (distracted mobile user): raw <img> hero with no responsive sizing risks slow/blurry load on mobile data. BlogFilters' category <select> triggers full page navigation with no loading indicator.

Sam (accessibility): category pill contrast (bg-primary/15 text-primary on #141414) likely borderline WCAG AA. Search icon SVGs lack aria-hidden.

## Minor Observations

- Excerpt border reuses border-emerald-500/70 — third occurrence of the same banned color.
- /blog/auteurs skips PageHero/containerClass() entirely — most template-feeling page in the surface.
- Pagination hand-coded three different ways across page.tsx, categorie/[slug], auteur/[slug].

## Questions to Consider

- If blog is meant to build trust ahead of registration, what does it say that it's the one surface that skipped the design system?
- The accent system (emerald/amber/neutral) lives in the Sanity schema itself — should editors control raw colors, or should schema expose semantic purpose and let code map to on-brand tokens?
