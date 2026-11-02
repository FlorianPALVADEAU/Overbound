import { redirect } from 'next/navigation'

/** `/admin` is the old address of the back-office; it keeps working, with any `?tab=` it was given. */
export default async function AdminLegacyRedirectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    const first = Array.isArray(value) ? value[0] : value
    if (first) params.set(key, first)
  }
  const query = params.toString()
  redirect(query ? `/dashboard?${query}` : '/dashboard')
}
