import { notFound } from 'next/navigation'
import { SuccessPreview } from './SuccessPreview'

// Dev-only: render the whole confirmation page with fake data, e.g. /dev/success?n=8
export default async function SuccessPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { n } = await searchParams
  const count = Math.min(Math.max(Number(n) || 1, 1), 50)
  return <SuccessPreview count={count} />
}
