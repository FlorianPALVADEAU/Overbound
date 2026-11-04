import { Suspense } from 'react'
import { GroupsSection } from '@/components/admin/groups/GroupsSection'

export default function GroupsPage() {
  return (
    <Suspense fallback={null}>
      <GroupsSection />
    </Suspense>
  )
}
