import { COVER } from '@/constants/coverImages'
import Link from 'next/link'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import BlogFilters from '@/components/blog/BlogFilters'
import BlogPagination from '@/components/blog/BlogPagination'
import { listCategoriesWithCounts, listPosts } from '@/lib/blog/loadPosts'
import { BLOG_CATEGORIES } from '@/lib/blog/categories'
import { pickMostReadPosts, rankPostsByPopularity } from '@/lib/blog/views'
import { createSupabaseBlogViewStore, loadBlogViewCounts } from '@/lib/blog/viewStore'
import { PageHero } from '@/components/hero/PageHero'
import { containerClass, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12;

const SECTION_TITLE_CLASS = cn(DISPLAY_TITLE, 'mb-6 text-display-md');

// Articles are MDX files read at build time. Search and category come from the URL.

type BlogSearchParams = Promise<{ page?: string; q?: string; category?: string }>;

interface CategoryWithCount {
  slug: string;
  title: string;
  count: number;
}

export default async function BlogIndex({ searchParams }: { searchParams: BlogSearchParams }) {
  const { page, q: rawQ, category: rawCategory } = await searchParams;
  const q = rawQ?.trim();
  const category = rawCategory?.trim();

  const current = Math.max(1, parseInt(page || "1", 10) || 1);
  const offset = (current - 1) * PAGE_SIZE;

  // Popularité sur 90 jours (une visite = une vue), à égalité le plus récent. Tri après filtre.
  const views = await loadBlogViewCounts(createSupabaseBlogViewStore());
  const ranked = rankPostsByPopularity(listPosts({ q, category }).items, views);
  // Le bloc « Les plus lus » ne s'affiche que sans recherche ni catégorie. Ses articles sortent
  // du feed sur toutes les pages, pour que la pagination reste cohérente.
  const isUnfiltered = !q && !category;
  const mostRead = isUnfiltered ? pickMostReadPosts(ranked, views) : [];
  const mostReadSlugs = new Set(mostRead.map((p) => p.slug));
  const feed = ranked.filter((p) => !mostReadSlugs.has(p.slug));
  const total = feed.length;
  const posts = feed.slice(offset, offset + PAGE_SIZE);
  const counts = listCategoriesWithCounts();
  const categories: CategoryWithCount[] = BLOG_CATEGORIES.map((c) => ({ ...c, count: counts.get(c.slug) ?? 0 }));
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildUrl = (nextPage: number) => {
    const search = new URLSearchParams();
    if (nextPage > 1) search.set("page", String(nextPage));
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    return `/blog${search.toString() ? `?${search.toString()}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <BlogHero />

      <div className={cn(containerClass(), 'py-16')}>
        <BlogFilters categories={categories} />
        <CategoryPillars categories={categories} active={category} />

        {current === 1 && mostRead.length > 0 ? (
          <section aria-labelledby="most-read-title" className="mb-16">
            <h2 id="most-read-title" className={SECTION_TITLE_CLASS}>
              Les plus lus
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {mostRead.map((p) => (
                <BlogArticleItem key={p.slug} post={p} showExcerpt={false} />
              ))}
            </div>
          </section>
        ) : null}

        {posts.length > 0 ? (
          <>
            {mostRead.length > 0 ? (
              <h2 id="all-articles-title" className={SECTION_TITLE_CLASS}>
                Tous les articles
              </h2>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {posts.map((p) => (
                <BlogArticleItem key={p.slug} post={p} />
              ))}
            </div>

            <BlogPagination current={current} pageCount={pageCount} hrefFor={buildUrl} />
          </>
        ) : mostRead.length > 0 ? null : (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <p className="text-title font-semibold text-muted-foreground">Aucun article trouvé</p>
            {q && (
              <Link
                href="/blog"
                className="mt-4 text-sm text-primary hover:underline"
              >
                Voir tous les articles
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function BlogHero() {
  return (
    <PageHero
      variant="compact"
      titleSize="xl"
      image={{ src: COVER.pages.blog, alt: 'OverBound Blog', position: '50% 30%' }}
      eyebrow="La tribu OverBound"
      title="Préparer la boucle"
      description="Entraînement, récupération et préparation pour la boucle d'environ 2 km, en format OPEN ou RANKED. Conseils et histoires de la tribu Overbound."
    />
  );
}

// Five most-used categories as one-tap filters; the long tail stays in the select.
function CategoryPillars({ categories, active }: { categories: CategoryWithCount[]; active?: string }) {
  const pillars = [...categories].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <nav aria-label="Catégories populaires" className="mb-12 flex flex-wrap items-center gap-2">
      {pillars.map((cat) => {
        const isActive = cat.slug === active;
        return (
          <Link
            key={cat.slug}
            href={`/blog?category=${cat.slug}`}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors',
              isActive ? 'border-primary text-primary' : 'border-border hover:bg-muted',
            )}
          >
            {cat.title}
          </Link>
        );
      })}
      <Link href="/blog/categories" className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:text-foreground hover:underline">
        Toutes les catégories
      </Link>
    </nav>
  );
}
