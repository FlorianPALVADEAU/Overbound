import { redirect } from 'next/navigation'

/** The card form now lives on the checkout page. Old links and open tabs land there, draft intact. */
export default async function EventPaymentRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/events/${id}/register`)
}
