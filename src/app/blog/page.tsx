import Link from "next/link";
import BlogArticleItem from "@/components/blog/BlogArticleItem";
import BlogFilters from "@/components/blog/BlogFilters";
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

        {posts.length > 0 ? (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <BlogArticleItem key={p._id} post={p} />
              ))}
            </div>

            {pageCount > 1 && (
              <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-4">
                {current > 1 && (
                  <Link
                    href={buildUrl(current - 1)}
                    className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Précédent
                  </Link>
                )}
                <span className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">
                  Page {current} / {pageCount}
                </span>
                {current < pageCount && (
                  <Link
                    href={buildUrl(current + 1)}
                    className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Suivant
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <p className="text-lg font-medium text-muted-foreground">
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
      image={{ src: '/images/images/an-armed-crossed-man-talking-in-a-middle-of-a-circle-of-people.avif', alt: 'OverBound Blog', position: '50% 30%' }}
      eyebrow="La tribu OverBound"
      title="Conseils, actus et coulisses"
      description="Entraînement, nutrition, préparation et histoires de la tribu."
      actions={
        <>
          <Link href="/blog/categories" className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm hover:bg-background/50">
            Voir les catégories
          </Link>
          <Link href="/blog/auteurs" className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm hover:bg-background/50">
            Nos auteurs
          </Link>
        </>
      }
    />
  );
}
