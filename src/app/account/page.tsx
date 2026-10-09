import { redirect } from 'next/navigation'
import { AccountHome } from '@/components/account/home/AccountHome'

type SearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/**
 * Legacy `/account?tab=…` links (emails, shared group invites) now live on
 * their own routes; the invite code must survive the redirect.
 */
const legacyTabTarget = (searchParams: SearchParams): string | null => {
  const tab = first(searchParams.tab)
  if (tab === 'group') {
    const join = first(searchParams.join)
    return join ? `/account/group?join=${encodeURIComponent(join)}` : '/account/group'
  }
  if (tab === 'profile' || tab === 'notifications') return '/account/profile'
  return null
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const target = legacyTabTarget(await searchParams)
  if (target) redirect(target)

  return <AccountHome />
}
