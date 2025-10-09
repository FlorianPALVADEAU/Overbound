'use client'

/* eslint-disable react/no-unescaped-entities */
import { Trophy, Target, Star, Eye } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRaces, type RaceListItem } from '@/app/api/races/racesQueries'

const RACE_TYPES: Record<string, string> = {
  trail: 'Trail',
  obstacle: "Course d'obstacles",
  urbain: 'Course urbaine',
  nature: 'Course nature',
  extreme: 'Course extrême',
}

const TARGET_PUBLICS: Record<string, string> = {
  débutant: 'Débutant',
  intermédiaire: 'Intermédiaire',
  expert: 'Expert',
  famille: 'Famille',
  pro: 'Professionnel',
}

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 3) return 'bg-green-100 text-green-800 border-green-200'
  if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'trail':
      return 'bg-blue-100 text-blue-800'
    case 'obstacle':
      return 'bg-orange-100 text-orange-800'
    case 'urbain':
      return 'bg-purple-100 text-purple-800'
    case 'nature':
      return 'bg-green-100 text-green-800'
    case 'extreme':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPublicColor = (targetPublic: string) => {
  switch (targetPublic) {
    case 'débutant':
      return 'bg-emerald-100 text-emerald-800'
    case 'intermédiaire':
      return 'bg-amber-100 text-amber-800'
    case 'expert':
      return 'bg-red-100 text-red-800'
    case 'famille':
      return 'bg-pink-100 text-pink-800'
    case 'pro':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function RacesPage() {
  const { data: races = [], isLoading, error, refetch } = useRaces()

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold">Nos Courses</h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Découvrez notre gamme complète de courses sportives, des parcours familiaux aux défis extrêmes. Chaque course est conçue pour offrir une expérience unique et mémorable.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Chargement des courses…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <Card className="max-w-md">
              <CardContent className="space-y-3 p-6 text-center">
                <p className="font-semibold text-destructive">Impossible de charger les courses</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : races.length === 0 ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Aucune course disponible</h3>
              <p className="text-muted-foreground">
                Les courses seront bientôt disponibles. Revenez plus tard !
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race: RaceListItem) => (
              <Card key={race.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/20">
                  {race.logo_url ? (
                    <img src={race.logo_url} alt={race.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Trophy className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className={getDifficultyColor(race.difficulty)}>
                      <Star className="mr-1 h-3 w-3" />
                      {race.difficulty}/10
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                    <Button variant="secondary" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </Button>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{race.name}</CardTitle>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getTypeColor(race.type)}>
                      {RACE_TYPES[race.type] || race.type}
                    </Badge>
                    <Badge variant="outline" className={getPublicColor(race.target_public)}>
                      {TARGET_PUBLICS[race.target_public] || race.target_public}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {race.description ?? "Pas de description disponible."}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Distance :</span>
                      {race.distance_km ? `${race.distance_km} km` : 'À venir'}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Public :</span>
                      {TARGET_PUBLICS[race.target_public] || race.target_public}
                    </div>
                  </div>

                  {race.obstacles && race.obstacles.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Obstacles mis en avant :</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {race.obstacles.slice(0, 3).map((entry) => (
                          <Badge key={entry.obstacle.id} variant="outline">
                            {entry.obstacle.name}
                          </Badge>
                        ))}
                        {race.obstacles.length > 3 ? (
                          <Badge variant="outline">+{race.obstacles.length - 3}</Badge>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-2">
                    <Link href={`/races/${race.id}`}>
                      <Button variant="default" size="sm">
                        Découvrir la course
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
