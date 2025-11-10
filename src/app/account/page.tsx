'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAccountRegistrations } from '@/app/api/account/registrations/accountRegistrationsQueries'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertTriangle, TicketIcon, UserIcon, LogOutIcon, BellIcon } from 'lucide-react'
import { AccountRegistrationsList } from '@/components/account/AccountRegistrationsList'
import { AccountProfileForm } from '@/components/account/AccountProfileForm'
import PreferencesForm from '@/components/preferences/PreferencesForm'

import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSession } from '../api/session/sessionQueries'

function LoadingView() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl space-y-8 p-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`account-skeleton-${index}`}>
              <CardContent className="space-y-2 p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`account-list-skeleton-${index}`} className="flex items-center justify-between rounded-lg border border-dashed border-muted/40 p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function UnauthorizedView() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="text-center p-8 space-y-4">
          <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Connexion requise</h2>
            <p className="text-sm text-muted-foreground">
              Connecte-toi pour voir tes inscriptions et gérer ton compte.
            </p>
          </div>
          <Link href="/auth/login">
            <Button>Se connecter</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

export default function AccountPage() {
  const { data, isLoading, error, refetch } = useAccountRegistrations()
  const { data: authUser, isLoading: isAuthLoading } = useSession()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)

  if (isLoading || isAuthLoading) {
    return <LoadingView />
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="font-semibold text-destructive">Impossible de charger vos données</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()}>Réessayer</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!data?.user || !authUser) {
    return <UnauthorizedView />
  }

  const { user, profile, stats, registrations } = data
  const needsDocumentAction = registrations.some(
    (registration) => registration.document_requires_attention,
  )
  const profileIncomplete =
    !profile?.full_name || !profile?.phone || !profile?.date_of_birth
  const avatarNeedsAttention = needsDocumentAction || profileIncomplete
  const formattedBirthdate = profile?.date_of_birth
    ? new Date(profile.date_of_birth).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : null
    
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={
                          profile?.avatar_url ||
                          authUser?.user?.user_metadata?.avatar_url ||
                          undefined
                        }
                        alt={profile?.full_name || user.email || undefined}
                      />
                      <AvatarFallback className="text-lg">
                        {(profile?.full_name || user.email || 'A')
                          .split(' ')
                          .filter(Boolean)
                          .map((name) => name[0]?.toUpperCase())
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {avatarNeedsAttention ? (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-background bg-destructive text-[11px] font-bold leading-none text-white">
                        !
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold">{profile?.full_name || 'Athlète'}</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {formattedBirthdate ? (
                      <p className="text-sm text-muted-foreground">
                        Date de naissance : {formattedBirthdate}
                      </p>
                    ) : null}
                    {profile?.role === 'admin' ? (
                      <Badge variant="secondary" className="mt-1">
                        Administrateur
                      </Badge>
                    ) : null}
                    {profileIncomplete ? (
                      <Badge variant="destructive" className="mt-1 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Profil incomplet
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/account/tickets">
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        needsDocumentAction
                          ? 'relative border-destructive text-destructive hover:bg-destructive/10'
                          : undefined
                      }
                    >
                      {needsDocumentAction ? (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-background bg-destructive text-[10px] font-bold leading-none text-white">
                          !
                        </span>
                      ) : null}
                      Mes billets
                    </Button>
                  </Link>
                  {profile?.role === 'admin' ? (
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Administration
                      </Button>
                    </Link>
                  ) : null}
                  <Link href="/logout">
                    <Button variant="outline" size="sm">
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Déconnexion
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b border-border/60 pb-6">
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mets à jour tes informations de contact. Ton adresse e-mail est liée à ton compte et
                ne peut pas être modifiée.
              </CardDescription>
              <CardAction className="flex items-center gap-3">
                {profileIncomplete ? (
                  <Badge variant="destructive" className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    À compléter
                  </Badge>
                ) : null}
                <Button
                  variant={
                    isEditingProfile ? 'outline' : profileIncomplete ? 'destructive' : 'outline'
                  }
                  size="sm"
                  onClick={() => setIsEditingProfile((prev) => !prev)}
                >
                  {isEditingProfile
                    ? 'Fermer'
                    : profileIncomplete
                      ? 'Compléter mon profil'
                      : 'Modifier'}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="text-base font-medium">{profile?.full_name || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adresse e-mail</p>
                  <p className="text-base font-medium">{user.email ?? 'Non renseignée'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="text-base font-medium">{profile?.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de naissance</p>
                  <p className="text-base font-medium">
                    {formattedBirthdate || 'Non renseignée'}
                  </p>
                </div>
              </div>
              {profileIncomplete && !isEditingProfile ? (
                <Alert variant="default">
                  <AlertDescription>
                    Ton profil est incomplet. Clique sur « Compléter mon profil » pour ajouter les
                    informations manquantes.
                  </AlertDescription>
                </Alert>
              ) : null}
              {isEditingProfile ? (
                <AccountProfileForm
                  profile={profile}
                  email={user.email}
                  onSuccess={() => setIsEditingProfile(false)}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/60 pb-6">
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Préférences de notifications
              </CardTitle>
              <CardDescription>
                Gère tes préférences d'emails marketing et la fréquence à laquelle tu souhaites recevoir nos communications.
              </CardDescription>
              <CardAction className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingPreferences((prev) => !prev)}
                >
                  {isEditingPreferences ? 'Fermer' : 'Gérer mes préférences'}
                </Button>
              </CardAction>
            </CardHeader>
            {isEditingPreferences ? (
              <CardContent className="pt-6">
                <PreferencesForm
                  userId={(profile as any)?.id || user.id}
                  userName={profile?.full_name || ''}
                  initialPreferences={{
                    marketing_opt_in: profile?.marketing_opt_in || false,
                  }}
                />
              </CardContent>
            ) : (
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Statut des emails marketing</p>
                    <p className="text-base font-medium">
                      {profile?.marketing_opt_in ? (
                        <span className="text-green-600">Activés - Tu reçois nos communications</span>
                      ) : (
                        <span className="text-muted-foreground">Désactivés - Tu ne reçois pas nos emails marketing</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique sur "Gérer mes préférences" pour configurer en détail les types d'emails que tu souhaites recevoir et leur fréquence.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {needsDocumentAction ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Action requise : complète ou mets à jour tes documents pour valider tes inscriptions. Tes billets restent inactifs tant que la validation n&apos;est pas terminée.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total événements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Événements à venir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.upcomingEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.checkedInEvents}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Mes inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="py-12 text-center">
                <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune inscription</h3>
                <p className="text-muted-foreground mb-4">
                  Tu n&apos;as pas encore d&apos;inscription à un événement.
                </p>
                <Link href="/events">
                  <Button>Découvrir les événements</Button>
                </Link>
              </div>
            ) : (
              <AccountRegistrationsList registrations={registrations} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
