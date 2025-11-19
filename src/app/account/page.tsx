'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAccountRegistrations } from '@/app/api/account/registrations/accountRegistrationsQueries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, TicketIcon, UserIcon, LogOutIcon, BellIcon, LayoutDashboard, Settings } from 'lucide-react'
import { AccountRegistrationsList } from '@/components/account/AccountRegistrationsList'
import { AccountProfileForm } from '@/components/account/AccountProfileForm'
import PreferencesForm from '@/components/preferences/PreferencesForm'

import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSession } from '../api/session/sessionQueries'

function LoadingView() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 sm:w-40" />
                <Skeleton className="h-4 w-40 sm:w-56" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={`skeleton-${index}`} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function UnauthorizedView() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full">
        <CardContent className="text-center p-6 sm:p-8 space-y-4">
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

  if (isLoading || isAuthLoading) {
    return <LoadingView />
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6">
        <Card className="w-full">
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
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header compact avec avatar et actions */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                    <AvatarImage
                      src={
                        profile?.avatar_url ||
                        authUser?.user?.user_metadata?.avatar_url ||
                        undefined
                      }
                      alt={profile?.full_name || user.email || undefined}
                    />
                    <AvatarFallback className="text-base sm:text-lg">
                      {(profile?.full_name || user.email || 'A')
                        .split(' ')
                        .filter(Boolean)
                        .map((name) => name[0]?.toUpperCase())
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {avatarNeedsAttention ? (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-background bg-destructive text-[10px] font-bold leading-none text-white">
                      !
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold truncate">{profile?.full_name || 'Athlète'}</h1>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  {profile?.role === 'admin' ? (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Admin
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
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
                    <TicketIcon className="h-4 w-4 mr-1.5" />
                    Billets
                  </Button>
                </Link>
                {profile?.role === 'admin' ? (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1.5" />
                      Admin
                    </Button>
                  </Link>
                ) : null}
                <Link href="/logout">
                  <Button variant="ghost" size="sm">
                    <LogOutIcon className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1.5">Déconnexion</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerte si action requise */}
        {needsDocumentAction ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Action requise : complète ou mets à jour tes documents pour valider tes inscriptions.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Tabs pour organiser le contenu */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 data-[state=active]:bg-background">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Accueil</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-1.5 data-[state=active]:bg-background relative"
            >
              <UserIcon className="h-4 w-4" />
              Profil
              {profileIncomplete ? (
                <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive" />
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5 data-[state=active]:bg-background">
              <BellIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notifs</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalEvents}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">À venir</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.upcomingEvents}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Terminés</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.checkedInEvents}</p>
                </CardContent>
              </Card>
            </div>

            {/* Liste des inscriptions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TicketIcon className="h-5 w-5" />
                  Mes inscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="py-8 sm:py-12 text-center">
                    <TicketIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">Aucune inscription</h3>
                    <p className="text-sm text-muted-foreground mb-4">
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
          </TabsContent>

          {/* Tab: Profil */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader className="border-b border-border/60 pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Informations personnelles</CardTitle>
                    <CardDescription className="text-sm">
                      Mets à jour tes informations de contact.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {profileIncomplete ? (
                      <Badge variant="destructive" className="inline-flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Incomplet
                      </Badge>
                    ) : null}
                    <Button
                      variant={isEditingProfile ? 'outline' : profileIncomplete ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setIsEditingProfile((prev) => !prev)}
                    >
                      {isEditingProfile ? 'Annuler' : profileIncomplete ? 'Compléter' : 'Modifier'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                {isEditingProfile ? (
                  <AccountProfileForm
                    profile={profile}
                    email={user.email}
                    onSuccess={() => setIsEditingProfile(false)}
                  />
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Nom complet</p>
                        <p className="text-sm sm:text-base font-medium">{profile?.full_name || 'Non renseigné'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Adresse e-mail</p>
                        <p className="text-sm sm:text-base font-medium truncate">{user.email ?? 'Non renseignée'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Téléphone</p>
                        <p className="text-sm sm:text-base font-medium">{profile?.phone || 'Non renseigné'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Date de naissance</p>
                        <p className="text-sm sm:text-base font-medium">{formattedBirthdate || 'Non renseignée'}</p>
                      </div>
                    </div>
                    {profileIncomplete ? (
                      <Alert variant="default">
                        <AlertDescription className="text-sm">
                          Ton profil est incomplet. Clique sur « Compléter » pour ajouter les informations manquantes.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Notifications */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BellIcon className="h-5 w-5" />
                  Préférences de notifications
                </CardTitle>
                <CardDescription className="text-sm">
                  Gère tes préférences d'emails marketing et la fréquence de nos communications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreferencesForm
                  userId={(profile as any)?.id || user.id}
                  userName={profile?.full_name || ''}
                  initialPreferences={{
                    marketing_opt_in: profile?.marketing_opt_in || false,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
