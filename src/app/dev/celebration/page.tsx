import { notFound } from 'next/navigation'
import { CelebrationPlayground } from './CelebrationPlayground'

// Dev-only: replay the post-purchase celebration without a real registration.
export default function CelebrationPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <CelebrationPlayground />
}
