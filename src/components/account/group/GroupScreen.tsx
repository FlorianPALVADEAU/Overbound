'use client'

import { useMyGroup } from '@/app/api/groups/groupQueries'
import { AccountDataBoundary } from '@/components/account/AccountDataBoundary'
import { AccountScreen } from '@/components/account/AccountScreen'
import { Skeleton } from '@/components/ui/skeleton'
import { FAKE_MY_GROUP } from '@/lib/groups/fakeData'
import { GroupDetails } from './GroupDetails'
import { GroupEmpty } from './GroupEmpty'

const USE_FAKE = process.env.NEXT_PUBLIC_FAKE_GROUPS === 'true'

function GroupContent({ userId, fullName }: { userId: string; fullName: string | null | undefined }) {
  const { data: group, isLoading } = useMyGroup()

  if (isLoading) {
    return (
      <AccountScreen>
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AccountScreen>
    )
  }

  return (
    <AccountScreen narrow={!group}>
      {group ? (
        <GroupDetails group={group} currentUserId={USE_FAKE ? FAKE_MY_GROUP.captain_id : userId} />
      ) : (
        <GroupEmpty fullName={fullName} />
      )}
    </AccountScreen>
  )
}

export function GroupScreen() {
  return (
    <AccountDataBoundary>
      {({ user, profile }) => <GroupContent userId={user.id} fullName={profile?.full_name} />}
    </AccountDataBoundary>
  )
}
