import { safeJsonStringify } from '@/lib/safeJson'

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(data) }} />
}
