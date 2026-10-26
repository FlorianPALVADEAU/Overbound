import { buildLlmsTxt } from '@/lib/seo/llmsTxt'
import { loadNextEdition } from '@/lib/seo/loadNextEdition'

export const revalidate = 3600

export async function GET() {
  return new Response(buildLlmsTxt(await loadNextEdition()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
