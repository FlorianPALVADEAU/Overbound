import { redirect } from 'next/navigation'

export default function AdminLegacyRedirectPage() {
  redirect('/dashboard')
}
