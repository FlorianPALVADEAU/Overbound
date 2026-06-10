import { redirect } from 'next/navigation'

export default async function LegacyTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/account/tickets?ticket=${encodeURIComponent(id)}`)
}
