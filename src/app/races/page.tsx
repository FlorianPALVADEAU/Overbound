/* eslint-disable react/no-unescaped-entities */
// src/app/races/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Mountain, 
  Target, 
  Star, 
  Clock, 
  Users,
  Zap,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Race {
  id: string
  name: string
  logo_url?: string
  type: string
  difficulty: number
  target_public: string
  distance_km: number
  description?: string
  obstacles?: Array<{
    obstacle: {
      id: string
      name: string
      type: string
      difficulty: number
    }
    order_position: number
    is_mandatory: boolean
  }>
}

const RACE_TYPES = {
  'trail': 'Trail',
  'obstacle': 'Course d\'obstacles',
  'urbain': 'Course urbaine',
  'nature': 'Course nature',
  'extreme': 'Course extrême'
}

const TARGET_PUBLICS = {
  'débutant': 'Débutant',
  'intermédiaire': 'Intermédiaire',
  'expert': 'Expert',
  'famille': 'Famille',
  'pro': 'Professionnel'
}

export default async function RacesPage() {
  const supabase = await createSupabaseServer()

  // Récupérer toutes les courses avec leurs obstacles
  const { data: races, error } = await supabase
    .from('races')
    .select(`
      *,
      obstacles:race_obstacles!race_obstacles_race_id_fkey(
        order_position,
        is_mandatory,
        obstacle:obstacles!race_obstacles_obstacle_id_fkey(id, name, type, difficulty)
      )
    `)
    .order('difficulty', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des courses:', error)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800 border-green-200'
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trail': return 'bg-blue-100 text-blue-800'
      case 'obstacle': return 'bg-orange-100 text-orange-800'
      case 'urbain': return 'bg-purple-100 text-purple-800'
      case 'nature': return 'bg-green-100 text-green-800'
      case 'extreme': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPublicColor = (targetPublic: string) => {
    switch (targetPublic) {
      case 'débutant': return 'bg-emerald-100 text-emerald-800'
      case 'intermédiaire': return 'bg-amber-100 text-amber-800'
      case 'expert': return 'bg-red-100 text-red-800'
      case 'famille': return 'bg-pink-100 text-pink-800'
      case 'pro': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Nos Courses</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Découvrez notre gamme complète de courses sportives, des parcours familiaux 
            aux défis extrêmes. Chaque course est conçue pour offrir une expérience unique 
            et mémorable.
          </p>
        </div>

        {/* Filtres rapides */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Toutes les courses
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Débutant
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Intermédiaire
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Expert
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Famille
          </Badge>
        </div>

        {/* Liste des courses */}
        {!races || races.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune course disponible</h3>
              <p className="text-muted-foreground">
                Les courses seront bientôt disponibles. Revenez plus tard !
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {races.map((race: Race) => (
              <Card key={race.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image/Logo de la course */}
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/20">
                  {race.logo_url ? (
                    <img 
                      src={race.logo_url} 
                      alt={race.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Trophy className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                  
                  {/* Badge de difficulté */}
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className={getDifficultyColor(race.difficulty)}>
                      <Star className="h-3 w-3 mr-1" />
                      {race.difficulty}/10
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{race.name}</CardTitle>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getTypeColor(race.type)}>
                      {RACE_TYPES[race.type as keyof typeof RACE_TYPES] || race.type}
                    </Badge>
                    <Badge variant="outline" className={getPublicColor(race.target_public)}>
                      <Target className="h-3 w-3 mr-1" />
                      {TARGET_PUBLICS[race.target_public as keyof typeof TARGET_PUBLICS] || race.target_public}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Description */}
                  {race.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {race.description}
                    </p>
                  )}

                  {/* Informations principales */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mountain className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{race.distance_km} km</span>
                    </div>
                    
                    {race.obstacles && race.obstacles.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>{race.obstacles.length} obstacle(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Obstacles principaux */}
                  {race.obstacles && race.obstacles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Obstacles inclus :</h4>
                      <div className="flex flex-wrap gap-1">
                        {race.obstacles.slice(0, 3).map(({ obstacle }) => (
                          <Badge key={obstacle.id} variant="secondary" className="text-xs">
                            {obstacle.name}
                          </Badge>
                        ))}
                        {race.obstacles.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{race.obstacles.length - 3} autres
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/races/${race.id}`} className="flex-1">
                      <Button className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Section d'informations */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pour tous les niveaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nos courses sont conçues pour accueillir tous les niveaux, 
                des débutants aux athlètes confirmés.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Obstacles variés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Chaque course propose des défis uniques avec une variété 
                d'obstacles testant force, agilité et endurance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Expérience mémorable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vivez des moments inoubliables dans un cadre exceptionnel 
                avec une organisation de qualité.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}