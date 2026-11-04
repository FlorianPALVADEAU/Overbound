import { COVER } from '@/constants/coverImages'
import Link from "next/link";
import BlogArticleItem from "@/components/blog/BlogArticleItem";
import BlogFilters from "@/components/blog/BlogFilters";
import BlogPagination from "@/components/blog/BlogPagination";
import { fetchBlogCategories, fetchBlogPosts, type BlogPost, type Category } from "@/app/api/blog/blogQueries";
import { PageHero } from '@/components/hero/PageHero'
import { containerClass } from '@/components/ds'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12;

// Rendered on the server so the articles are in the HTML. Search and
// category come from the URL; Sanity results are cached for a minute.
export const revalidate = 60;

type BlogSearchParams = Promise<{ page?: string; q?: string; category?: string }>;

export default async function BlogIndex({ searchParams }: { searchParams: BlogSearchParams }) {
  const { page, q: rawQ, category: rawCategory } = await searchParams;
  const q = rawQ?.trim();
  const category = rawCategory?.trim();

  const current = Math.max(1, parseInt(page || "1", 10) || 1);
  const offset = (current - 1) * PAGE_SIZE;

  // A Sanity outage shows an explicit message instead of an error page.
  const [postsData, categories] = await Promise.all([
    fetchBlogPosts({ offset, end: offset + PAGE_SIZE, q: q ? `*${q}*` : "", category: category ?? "" }).catch(
      (error: unknown) => {
        console.error('[blog] posts read failed', error);
        return null;
      },
    ),
    fetchBlogCategories().catch((): Category[] => []),
  ]);

  const posts: BlogPost[] = postsData?.items ?? [];
  const total = postsData?.total ?? 0;
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

        {posts.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {posts.map((p) => (
                <BlogArticleItem key={p._id} post={p} />
              ))}
            </div>

            <BlogPagination current={current} pageCount={pageCount} hrefFor={buildUrl} />
          </>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <p className="text-title font-semibold text-muted-foreground">
              {postsData ? 'Aucun article trouvé' : 'Les articles ne peuvent pas être chargés pour le moment.'}
            </p>
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
function CategoryPillars({ categories, active }: { categories: Category[]; active?: string }) {
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
      <Link href="/blog/auteurs" className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:text-foreground hover:underline">
        Nos auteurs
      </Link>
    </nav>
  );
}
