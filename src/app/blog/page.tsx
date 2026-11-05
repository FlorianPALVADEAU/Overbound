import { COVER } from '@/constants/coverImages'
import Link from "next/link";
import BlogArticleItem from "@/components/blog/BlogArticleItem";
import BlogFilters from "@/components/blog/BlogFilters";
import { listPosts, listCategoriesWithCounts } from "@/lib/blog/loadPosts";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import { PageHero } from '@/components/hero/PageHero'
import { Section, Container } from '@/components/ds'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 12;

// Posts are filesystem content (MDX): no revalidation window needed, the
// page is static at build time like the rest of the file-based content.

type BlogSearchParams = Promise<{ page?: string; q?: string; category?: string }>;

export default async function BlogIndex({ searchParams }: { searchParams: BlogSearchParams }) {
  const { page, q: rawQ, category: rawCategory } = await searchParams;
  const q = rawQ?.trim();
  const category = rawCategory?.trim();

  const current = Math.max(1, parseInt(page || "1", 10) || 1);
  const offset = (current - 1) * PAGE_SIZE;

  const { items: posts, total } = listPosts({ offset, limit: PAGE_SIZE, q, category });
  const counts = listCategoriesWithCounts();
  const categories = BLOG_CATEGORIES.map((c) => ({ ...c, count: counts.get(c.slug) ?? 0 }));
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildUrl = (nextPage: number) => {
    const search = new URLSearchParams();
    if (nextPage > 1) search.set("page", String(nextPage));
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    return `/blog${search.toString() ? `?${search.toString()}` : ""}`;
  };

  return (
    <main className="bg-background text-foreground">
      <BlogHero />

      <Section>
        <Container>
          <BlogFilters categories={categories} />

          {posts.length > 0 ? (
            <>
              <div className="mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <BlogArticleItem key={p.slug} post={p} />
                ))}
              </div>

              {pageCount > 1 && (
                <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
                  {current > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={buildUrl(current - 1)}>Précédent</Link>
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Page {current} / {pageCount}
                  </span>
                  {current < pageCount && (
                    <Button variant="outline" asChild>
                      <Link href={buildUrl(current + 1)}>Suivant</Link>
                    </Button>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-lead text-muted-foreground">
                Aucun article trouvé
              </p>
              {q && (
                <Link
                  href="/blog"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Voir tous les articles
                </Link>
              )}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}

function BlogHero() {
  return (
    <PageHero
      image={{ src: COVER.pages.blog, alt: 'OverBound Blog', position: '50% 30%' }}
      eyebrow="La tribu OverBound"
      title="Conseils, actus et coulisses"
      description="Entraînement, nutrition, préparation et histoires de la tribu."
      actions={
        <Button variant="outline-on-photo" size="cta" asChild>
          <Link href="/blog/categories">Voir les catégories</Link>
        </Button>
      }
    />
  );
}
