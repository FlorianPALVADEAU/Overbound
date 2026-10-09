import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PreferencesForm from '@/components/preferences/PreferencesForm'
import { AccountScreen, Eyebrow } from '@/components/account/AccountScreen'

export default async function PreferencesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/preferences')
  }

  return (
    <AccountScreen narrow>
      <header className="mb-8">
        <Eyebrow>Mon compte</Eyebrow>
        <h1 className="mt-2 text-balance text-[2.5rem] font-black leading-[0.95] tracking-tight">Préférences d&apos;emails</h1>
        <p className="mt-3 text-muted-foreground">Choisis ce que tu veux recevoir. Appliqué immédiatement.</p>
      </header>

      <PreferencesForm />

      <p className="mt-10 border-t border-border pt-5 text-sm text-muted-foreground">
        Tes données ne sont jamais partagées avec des tiers.{' '}
        <Link href="/privacy-policies" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Politique de confidentialité
        </Link>
      </p>
    </AccountScreen>
  )
}
