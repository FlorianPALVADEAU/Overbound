import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret')
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) return new NextResponse('Invalid secret', { status: 401 })

  const body = await request.json().catch(() => null)
  // Revalide listing + page concernée si on a le slug
  revalidatePath('/blog')
  const slug = body?._type === 'post' ? body?.slug?.current : null
  if (slug) revalidatePath(`/blog/${slug}`)

  return NextResponse.json({ revalidated: true, slug })
}