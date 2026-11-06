import { NextResponse, type NextRequest } from 'next/server'
import { loadPostBySlug } from '@/lib/blog/loadPosts'
import { blogViewBodySchema } from '@/lib/blog/views'
import { createSupabaseBlogViewStore, recordBlogView } from '@/lib/blog/viewStore'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const parsed = blogViewBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  if (!loadPostBySlug(parsed.data.slug)) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
  }

  try {
    await recordBlogView(createSupabaseBlogViewStore(), {
      slug: parsed.data.slug,
      visitId: parsed.data.visitId,
      forwardedFor: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    })
    // 204 dans tous les cas utiles : un plafond ou un robot ne doit pas être visible du client.
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[blog views] enregistrement impossible', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
