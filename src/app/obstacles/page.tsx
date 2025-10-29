'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Zap, 
  Star, 
  Play,
  Target,
  ExternalLink,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { useGetObstacles } from '../api/obstacles/obstaclesQueries'
import { Obstacle } from '@/types/Obstacle'
import SubHeadings from '@/components/globals/SubHeadings'
import Headings from '@/components/globals/Headings'

const OBSTACLE_TYPES = {
  'climbing': 'Escalade',
  'jumping': 'Saut',
  'crawling': 'Ramper',
  'carrying': 'Porter',
  'balance': 'Équilibre',
  'strength': 'Force',
  'endurance': 'Endurance',
  'agility': 'Agilité',
  'water': 'Aquatique',
  'technical': 'Technique',
  'mental': 'Mental',
  'team': 'Équipe'
}

// Composant Skeleton pour les obstacles
const ObstacleSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <div className="relative h-48 bg-gray-200 animate-pulse">
        <div className="absolute top-3 right-3">
          <div className="h-6 w-16 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
      </div>

      <CardHeader className="pb-2">
        {/* Titre skeleton */}
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
        
        {/* Badges skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </CardHeader>
    </Card>
  )
}

export default function ObstaclesPage() {
  const { data: obstacles, isLoading, isFetching, error } = useGetObstacles()
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800 border-green-200'
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return 'Facile'
    if (difficulty <= 6) return 'Moyen'
    return 'Difficile'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'climbing': return 'bg-orange-100 text-orange-800'
      case 'jumping': return 'bg-blue-100 text-blue-800'
      case 'crawling': return 'bg-yellow-100 text-yellow-800'
      case 'carrying': return 'bg-purple-100 text-purple-800'
      case 'balance': return 'bg-pink-100 text-pink-800'
      case 'strength': return 'bg-red-100 text-red-800'
      case 'endurance': return 'bg-indigo-100 text-indigo-800'
      case 'agility': return 'bg-green-100 text-green-800'
      case 'water': return 'bg-cyan-100 text-cyan-800'
      case 'technical': return 'bg-gray-100 text-gray-800'
      case 'mental': return 'bg-violet-100 text-violet-800'
      case 'team': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-neutral-100 text-neutral-800'
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Zap className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Erreur lors du chargement des obstacles</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="hidden none">Nos Obstacles</h1>
            <Headings
              title="Nos Obstacles"
              description="Découvrez tous les défis qui vous attendent ! Chaque obstacle est conçu 
              pour tester différentes capacités : force, agilité, endurance, équilibre et mental."
            />
          </div>

          {/* Grille des obstacles avec loading state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {isLoading || isFetching ? (
              // Affichage des skeletons pendant le chargement
              Array.from({ length: 8 }).map((_, index) => (
                <ObstacleSkeleton key={index} />
              ))
            ) : (
              // Affichage des obstacles une fois chargés
              obstacles?.map((obstacle: Obstacle) => (
                <Card 
                  key={obstacle.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedObstacle(obstacle)}
                >
                  {/* Image/Vidéo */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/20">
                    {obstacle.image_url ? (
                      <img 
                        src={obstacle.image_url} 
                        alt={obstacle.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Zap className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    
                    {/* Badge de difficulté */}
                    <div className="absolute top-3 right-3">
                      <Badge className={getDifficultyColor(obstacle.difficulty)}>
                        <Star className="h-3 w-3 mr-1" />
                        {obstacle.difficulty}/10
                      </Badge>
                    </div>

                    {/* Badge vidéo si disponible */}
                    {obstacle.video_url && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-black/70 text-white border-0">
                          <Play className="h-3 w-3 mr-1" />
                          Vidéo
                        </Badge>
                      </div>
                    )}

                    {/* Overlay au hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{obstacle.name}</CardTitle>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={getTypeColor(obstacle.type)}>
                        {OBSTACLE_TYPES[obstacle.type as keyof typeof OBSTACLE_TYPES] || obstacle.type}
                      </Badge>
                      <Badge variant="outline" className={getDifficultyColor(obstacle.difficulty)}>
                        {getDifficultyLabel(obstacle.difficulty)}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>

          {/* Section d'informations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objectifs variés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Chaque obstacle cible des compétences spécifiques : force, agilité, 
                  endurance, équilibre et mental.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Niveaux progressifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Les obstacles sont classés de 1 à 10 pour vous permettre 
                  de progresser à votre rythme.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Sécurité garantie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tous nos obstacles sont conçus et installés selon les normes 
                  de sécurité les plus strictes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to action */}
          <div className="text-center">
            <Card className="w-full mx-auto">
              <CardContent className="space-y-8 p-8">
                <SubHeadings
                  title='Prêt à relever le défi ?'
                  description="Explorez nos courses et événements pour tester vos compétences sur ces obstacles passionnants."
                />
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/events">
                    <Button variant="outline" size="lg" className="text-lg px-8">
                      <Target className="h-5 w-5 mr-2" />
                      Prochains événements
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modale élargie pour les détails */}
      <Dialog open={!!selectedObstacle} onOpenChange={() => setSelectedObstacle(null)}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[80vw] lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-y-auto p-6">
          {selectedObstacle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  {selectedObstacle.name}
                  <Badge className={getDifficultyColor(selectedObstacle.difficulty)}>
                    <Star className="h-4 w-4 mr-1" />
                    {selectedObstacle.difficulty}/10
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Image/Vidéo principale */}
                <div className="relative h-64 md:h-96 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg overflow-hidden">
                  {selectedObstacle.video_url ? (
                    <iframe 
                      className="w-full h-full"
                      src={selectedObstacle.video_url.replace('watch?v=', 'embed/')}
                      title="YouTube video player" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      referrerPolicy="strict-origin-when-cross-origin" 
                      allowFullScreen={false}
                    />
                  ) : selectedObstacle.image_url ? (
                    <img 
                      src={selectedObstacle.image_url} 
                      alt={selectedObstacle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Zap className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Informations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informations</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={getTypeColor(selectedObstacle.type)}>
                          {OBSTACLE_TYPES[selectedObstacle.type as keyof typeof OBSTACLE_TYPES] || selectedObstacle.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">Difficulté :</span>
                        <Badge className={getDifficultyColor(selectedObstacle.difficulty)}>
                          <Star className="h-3 w-3 mr-1" />
                          {selectedObstacle.difficulty}/10 - {getDifficultyLabel(selectedObstacle.difficulty)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Actions</h3>
                    <div className="space-y-3">
                      {selectedObstacle.video_url && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            if (selectedObstacle.video_url) {
                              window.open(selectedObstacle.video_url, '_blank')
                            }
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Voir la vidéo de démonstration
                        </Button>
                      )}
                      
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Partager cet obstacle
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedObstacle.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedObstacle.description}
                    </p>
                  </div>
                )}

                {/* Conseils */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Conseils pour réussir</h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <ul className="text-sm space-y-2">
                      <li>• Échauffez-vous bien avant d'aborder cet obstacle</li>
                      <li>• Analysez la technique avant de vous lancer</li>
                      <li>• N'hésitez pas à demander conseil aux autres participants</li>
                      <li>• Respectez les consignes de sécurité</li>
                      <li>• Gardez votre calme et faites confiance à vos capacités</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}