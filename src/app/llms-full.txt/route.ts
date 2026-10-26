import { buildLlmsFullTxt } from '@/lib/seo/llmsTxt'
import { loadNextEdition } from '@/lib/seo/loadNextEdition'

export const revalidate = 3600

export async function GET() {
  return new Response(buildLlmsFullTxt(await loadNextEdition()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
