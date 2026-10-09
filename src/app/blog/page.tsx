'use client'

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import BlogArticleItem from "@/components/blog/BlogArticleItem";
import BlogFilters from "@/components/blog/BlogFilters";
import { useBlogPosts, useBlogCategories } from "@/app/api/blog/blogQueries";
import { BlogGridSkeleton, BlogFiltersSkeleton } from "@/components/blog/BlogSkeleton";
import { PageHero } from '@/components/hero/PageHero'

export default function BlogIndex() {
  return (
    <Suspense fallback={<BlogPageFallback />}>
      <BlogPageContent />
    </Suspense>
  );
}

function BlogPageContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page');
  const q = searchParams.get('q')?.trim();
  const category = searchParams.get('category')?.trim();

  const pageSize = 12;
  const current = Math.max(1, parseInt(page || "1", 10) || 1);
  const offset = (current - 1) * pageSize;
  const end = offset + pageSize;

  const params = useMemo(() => ({
    offset,
    end,
    q: q ? `*${q}*` : "",
    category: category ?? "",
  }), [offset, end, q, category]);

  const { data: postsData, isLoading: postsLoading } = useBlogPosts(params);
  const { data: categories, isLoading: categoriesLoading } = useBlogCategories();

  const posts = postsData?.items || [];
  const total = postsData?.total || 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const buildUrl = (nextPage: number) => {
    const search = new URLSearchParams();
    if (nextPage > 1) search.set("page", String(nextPage));
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    return `/blog${search.toString() ? `?${search.toString()}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <BlogHero />

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Search and Filters Section */}
        {categoriesLoading ? (
          <BlogFiltersSkeleton />
        ) : (
          <BlogFilters categories={categories || []} />
        )}

        {/* Articles grid */}
        {postsLoading ? (
          <BlogGridSkeleton />
        ) : posts && posts.length > 0 ? (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p: any) => (
                <BlogArticleItem key={p._id} post={p} />
              ))}
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <nav className="mt-16 flex items-center justify-center gap-4">
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
            <p className="text-lg font-medium text-muted-foreground">Aucun article trouvé</p>
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

function BlogPageFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <BlogHero />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <BlogFiltersSkeleton />
        <BlogGridSkeleton />
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
