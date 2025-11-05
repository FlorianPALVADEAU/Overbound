import AdminEventDetailPage from '@/components/admin/events/AdminEventDetailPage'

interface EventDetailRouteProps {
  params: Promise<{
    eventId: string
  }>
}

export default async function EventDetailRoute({ params }: EventDetailRouteProps) {
  const { eventId } = await params
  return <AdminEventDetailPage eventId={eventId} />
}
