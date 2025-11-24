import { client } from "@/sanity/lib/client";
import { paginatedPostsQuery, postsSearchQuery } from "@/sanity/lib/queries";
import Link from "next/link";
import Image from "next/image";
import BlogArticleItem from "@/components/blog/BlogArticleItem";

export const revalidate = 60;

export default async function BlogIndex({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = resolvedParams?.page;
  const q = resolvedParams?.q;
  const pageSize = 12;
  const current = Math.max(1, parseInt(page || "1", 10) || 1);
  const offset = (current - 1) * pageSize;
  const end = offset + pageSize;

  const query =
    q && q.trim().length > 0 ? postsSearchQuery : paginatedPostsQuery;
  const params =
    q && q.trim().length > 0
      ? { offset, end, q: `*${q.trim()}*` }
      : { offset, end };
  const { items: posts, total } = await client.fetch(query, params);
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero header */}
      <section className="relative isolate overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="/images/hero_header_poster.jpg"
            alt="OverBound Blog"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm">
              La tribu OverBound
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Conseils, actus et coulisses
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Entraînement, nutrition, préparation et histoires qui font vibrer
              nos courses. Tout pour progresser et kiffer sur les obstacles.
            </p>
            <div className="flex gap-3">
              <Link
                href="/blog/categories"
                className="px-4 py-2 rounded-full border text-sm hover:bg-background/50"
              >
                Voir les catégories
              </Link>
              <Link
                href="/blog/auteurs"
                className="px-4 py-2 rounded-full border text-sm hover:bg-background/50"
              >
                Nos auteurs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Search bar */}
        <div className="mb-12">
          <form action="/blog" className="mx-auto max-w-2xl">
            <div className="relative">
              <input
                type="text"
                name="q"
                defaultValue={q || ""}
                placeholder="Rechercher un article (titre, extrait, contenu)"
                className="w-full rounded-full border border-border bg-background px-6 py-4 pr-32 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Rechercher
              </button>
            </div>
          </form>
          {q && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Résultats pour <span className="font-semibold text-foreground">"{q}"</span> ({total} article{total > 1 ? 's' : ''})
            </p>
          )}
        </div>

        {/* Articles grid */}
        {posts && posts.length > 0 ? (
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
                    href={`/blog?page=${current - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
                    href={`/blog?page=${current + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
