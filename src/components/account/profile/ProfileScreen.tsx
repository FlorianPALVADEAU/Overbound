'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { AccountDataBoundary, type AuthenticatedAccountData } from '@/components/account/AccountDataBoundary'
import { AccountLinkRow } from '@/components/account/AccountLinkRow'
import { AccountScreen, AccountSection, Eyebrow } from '@/components/account/AccountScreen'
import { ProfileForm } from '@/components/account/profile/ProfileForm'
import PreferencesForm from '@/components/preferences/PreferencesForm'
import { AvatarUploader } from '@/components/account/profile/AvatarUploader'
import { storagePathFromPublicUrl } from '@/lib/account/avatar'
import { getAccountSpaces, normalizeRoles, resolveAccountAccess } from '@/lib/account/spaces'
import { cn } from '@/lib/utils'

function EmailPreferences() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-4 text-left"
      >
        <span>
          <span className="block text-base font-semibold">Emails et notifications</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">Annonces, alertes de prix, fréquence</span>
        </span>
        <ChevronDownIcon className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="pt-4">
          <PreferencesForm />
        </div>
      ) : null}
    </div>
  )
}

function ProfileContent({ user, profile }: AuthenticatedAccountData) {
  const access = resolveAccountAccess(normalizeRoles([profile?.role, user.user_metadata && (user.user_metadata as Record<string, unknown>).role]), user.email)
  const spaces = getAccountSpaces(access)

  return (
    <AccountScreen>
      <header className="mb-8 flex items-center gap-5">
        <AvatarUploader
          src={profile?.avatar_url ?? user.user_metadata?.avatar_url}
          name={profile?.full_name}
          email={user.email}
          canRemove={storagePathFromPublicUrl(profile?.avatar_url) !== null}
        />
        <div className="min-w-0">
          <Eyebrow>Mon compte</Eyebrow>
          <h1 className="truncate text-2xl font-black leading-tight tracking-tight">{profile?.full_name || 'Athlète'}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <div className="space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-16 lg:space-y-0">
        <div className="space-y-8">
          <AccountSection title="Mes informations" className="border-t-0 pt-0">
            <ProfileForm profile={profile} email={user.email} />
          </AccountSection>
        </div>

        <div className="space-y-8">
          {spaces.length > 0 ? (
            <AccountSection title="Mes espaces" className="border-t-0 pt-0">
              {spaces.map((space) => (
                <AccountLinkRow key={space.id} href={space.href} title={space.label} detail={space.description} />
              ))}
            </AccountSection>
          ) : null}

          <AccountSection className={spaces.length === 0 ? 'border-t-0 pt-0' : undefined}>
            <EmailPreferences />
          </AccountSection>

          <AccountSection>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
              <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 text-sm text-muted-foreground">
                <Link href="/privacy-policies" className="inline-flex min-h-11 items-center hover:text-foreground">
                  Confidentialité
                </Link>
                <Link href="/cgv" className="inline-flex min-h-11 items-center hover:text-foreground">
                  CGV
                </Link>
                <Link href="/contact" className="inline-flex min-h-11 items-center hover:text-foreground">
                  Contact
                </Link>
              </nav>
              <form action="/logout" method="post">
                <button type="submit" className="min-h-11 text-sm font-semibold text-destructive">
                  Se déconnecter
                </button>
              </form>
            </div>
          </AccountSection>
        </div>
      </div>
    </AccountScreen>
  )
}

export function ProfileScreen() {
  return <AccountDataBoundary>{(data) => <ProfileContent {...data} />}</AccountDataBoundary>
}
