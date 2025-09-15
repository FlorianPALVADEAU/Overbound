'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Image,
  Video,
  Star} from 'lucide-react'

interface Obstacle {
  id: string
  name: string
  description?: string
  image_url?: string
  video_url?: string
  difficulty: number
  type: string
  created_at: string
}

interface ObstacleFormData {
  name: string
  description: string
  image_url: string
  video_url: string
  difficulty: string
  type: string
}

const OBSTACLE_TYPES = [
  { value: 'force', label: 'Force' },
  { value: 'agilité', label: 'Agilité' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'technique', label: 'Technique' },
  { value: 'mental', label: 'Mental' },
  { value: 'équilibre', label: 'Équilibre' },
  { value: 'vitesse', label: 'Vitesse' }
]

export function AdminObstaclesCrud() {
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [filteredObstacles, setFilteredObstacles] = useState<Obstacle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Filtres
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState<ObstacleFormData>({
    name: '',
    description: '',
    image_url: '',
    video_url: '',
    difficulty: '5',
    type: 'force'
  })

  // Charger les obstacles
  const loadObstacles = async () => {
    try {
      const response = await fetch('/api/admin/obstacles')
      
      if (!response.ok) {
        throw new Error('Erreur de chargement')
      }
      
      const data = await response.json()
      setObstacles(data.obstacles || [])
      setFilteredObstacles(data.obstacles || [])
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement des obstacles' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadObstacles()
  }, [])

  // Filtrer les obstacles
  useEffect(() => {
    let filtered = obstacles

    if (searchTerm) {
      filtered = filtered.filter(obstacle =>
        obstacle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obstacle.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(obstacle => obstacle.type === typeFilter)
    }

    if (difficultyFilter !== 'all') {
      const [min, max] = difficultyFilter.split('-').map(Number)
      filtered = filtered.filter(obstacle => 
        obstacle.difficulty >= min && obstacle.difficulty <= max
      )
    }

    setFilteredObstacles(filtered)
  }, [obstacles, searchTerm, typeFilter, difficultyFilter])

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      video_url: '',
      difficulty: '5',
      type: 'force'
    })
    setSelectedObstacle(null)
    setIsCreateMode(false)
  }

  // Ouvrir le dialogue pour créer
  const handleCreate = () => {
    resetForm()
    setIsCreateMode(true)
    setIsDialogOpen(true)
  }

  // Ouvrir le dialogue pour éditer
  const handleEdit = (obstacle: Obstacle) => {
    setSelectedObstacle(obstacle)
    setFormData({
      name: obstacle.name,
      description: obstacle.description || '',
      image_url: obstacle.image_url || '',
      video_url: obstacle.video_url || '',
      difficulty: obstacle.difficulty.toString(),
      type: obstacle.type
    })
    setIsCreateMode(false)
    setIsDialogOpen(true)
  }

  // Prévisualiser un obstacle
  const handlePreview = (obstacle: Obstacle) => {
    setSelectedObstacle(obstacle)
    setIsPreviewOpen(true)
  }

  // Gérer les changements du formulaire
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Sauvegarder l'obstacle
  const handleSave = async () => {
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Veuillez saisir un nom pour l\'obstacle' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const method = isCreateMode ? 'POST' : 'PUT'
      const url = isCreateMode ? '/api/admin/obstacles' : `/api/admin/obstacles/${selectedObstacle?.id}`
      
      const dataToSend = {
        ...formData,
        difficulty: parseInt(formData.difficulty),
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        description: formData.description || null
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur de sauvegarde')
      }

      const result = await response.json()
      
      if (isCreateMode) {
        setObstacles(prev => [result.obstacle, ...prev])
        setMessage({ type: 'success', text: 'Obstacle créé avec succès' })
      } else {
        setObstacles(prev => prev.map(o => o.id === selectedObstacle?.id ? result.obstacle : o))
        setMessage({ type: 'success', text: 'Obstacle mis à jour avec succès' })
      }

      setIsDialogOpen(false)
      resetForm()
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' 
      })
    } finally {
      setSaving(false)
    }
  }

  // Supprimer un obstacle
  const handleDelete = async (obstacle: Obstacle) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${obstacle.name}" ?`)) {
      return
    }

    setDeleteLoading(obstacle.id)
    try {
      const response = await fetch(`/api/admin/obstacles/${obstacle.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setObstacles(prev => prev.filter(o => o.id !== obstacle.id))
      setMessage({ type: 'success', text: 'Obstacle supprimé avec succès' })
      
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    } finally {
      setDeleteLoading(null)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800'
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'force': return 'bg-red-100 text-red-800'
      case 'agilité': return 'bg-blue-100 text-blue-800'
      case 'endurance': return 'bg-orange-100 text-orange-800'
      case 'technique': return 'bg-purple-100 text-purple-800'
      case 'mental': return 'bg-pink-100 text-pink-800'
      case 'équilibre': return 'bg-indigo-100 text-indigo-800'
      case 'vitesse': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Chargement des obstacles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des obstacles</h2>
          <p className="text-muted-foreground">
            Créer et gérer les obstacles utilisés dans les courses
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel obstacle
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Recherche */}
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Rechercher un obstacle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtre par type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {OBSTACLE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre par difficulté */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes difficultés</SelectItem>
                <SelectItem value="1-3">Facile (1-3)</SelectItem>
                <SelectItem value="4-6">Moyen (4-6)</SelectItem>
                <SelectItem value="7-10">Difficile (7-10)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Liste des obstacles */}
      <div className="grid gap-4">
        {filteredObstacles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {obstacles.length === 0 ? 'Aucun obstacle' : 'Aucun résultat'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {obstacles.length === 0 
                  ? 'Commencez par créer votre premier obstacle'
                  : 'Aucun obstacle ne correspond à vos critères de recherche'
                }
              </p>
              {obstacles.length === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un obstacle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredObstacles.map((obstacle) => (
            <Card key={obstacle.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {/* Image de l'obstacle */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {obstacle.image_url ? (
                          <img 
                            src={obstacle.image_url} 
                            alt={obstacle.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Zap className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Informations de l'obstacle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold truncate">{obstacle.name}</h3>
                        <Badge variant="outline" className={getTypeColor(obstacle.type)}>
                          {OBSTACLE_TYPES.find(t => t.value === obstacle.type)?.label || obstacle.type}
                        </Badge>
                        <Badge variant="outline" className={getDifficultyColor(obstacle.difficulty)}>
                          <Star className="h-3 w-3 mr-1" />
                          {obstacle.difficulty}/10
                        </Badge>
                      </div>
                      
                      {obstacle.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {obstacle.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {obstacle.image_url && (
                          <div className="flex items-center gap-1">
                            <img className="h-4 w-4 object-cover rounded" src={obstacle.image_url} alt={obstacle.name} />
                            <span>Image</span>
                          </div>
                        )}
                        {obstacle.video_url && (
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            <span>Vidéo</span>
                          </div>
                        )}
                        <span>
                          Créé le {new Date(obstacle.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(obstacle)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(obstacle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(obstacle)}
                      disabled={deleteLoading === obstacle.id}
                    >
                      {deleteLoading === obstacle.id ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog pour créer/éditer */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Créer un obstacle' : 'Modifier l\'obstacle'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Créez un nouvel obstacle avec ses caractéristiques'
                : 'Modifiez les informations de cet obstacle'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'obstacle *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ex: Mur de corde, Ramper sous barbelés..."
              />
            </div>

            {/* Type et Difficulté */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type d'obstacle *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: string) => handleFormChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBSTACLE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté (1-10) *</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(value: string) => handleFormChange('difficulty', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}/10 {num <= 3 ? '(Facile)' : num <= 6 ? '(Moyen)' : '(Difficile)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description détaillée de l'obstacle, comment le franchir..."
                rows={4}
              />
            </div>

            {/* URLs Image et Vidéo */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">URL de l'image</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => handleFormChange('image_url', e.target.value)}
                  placeholder="https://example.com/obstacle-image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_url">URL de la vidéo (démonstration)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => handleFormChange('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            {/* Prévisualisation */}
            {(formData.image_url || formData.video_url) && (
              <div className="space-y-2">
                <Label>Prévisualisation</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {formData.image_url && (
                    <div>
                      <p className="text-sm font-medium mb-2">Image :</p>
                      <img 
                        src={formData.image_url} 
                        alt="Prévisualisation"
                        className="w-32 h-32 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  {formData.video_url && (
                    <div>
                      <p className="text-sm font-medium mb-2">Vidéo :</p>
                      <a 
                        href={formData.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ouvrir la vidéo dans un nouvel onglet
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {isCreateMode ? 'Création...' : 'Mise à jour...'}
                </>
              ) : (
                isCreateMode ? 'Créer' : 'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de prévisualisation */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedObstacle?.name}
              <Badge variant="outline" className={getTypeColor(selectedObstacle?.type || '')}>
                {OBSTACLE_TYPES.find(t => t.value === selectedObstacle?.type)?.label}
              </Badge>
              <Badge variant="outline" className={getDifficultyColor(selectedObstacle?.difficulty || 0)}>
                <Star className="h-3 w-3 mr-1" />
                {selectedObstacle?.difficulty}/10
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedObstacle && (
            <div className="space-y-6">
              {/* Image */}
              {selectedObstacle.image_url && (
                <div>
                  <img 
                    src={selectedObstacle.image_url} 
                    alt={selectedObstacle.name}
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Description */}
              {selectedObstacle.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedObstacle.description}
                  </p>
                </div>
              )}

              {/* Vidéo */}
              {selectedObstacle.video_url && (
                <div>
                  <h4 className="font-medium mb-2">Vidéo de démonstration</h4>
                  <a 
                    href={selectedObstacle.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Video className="h-4 w-4" />
                    Ouvrir la vidéo
                  </a>
                </div>
              )}

              {/* Informations techniques */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="text-sm font-medium">Type :</span>
                  <p className="text-sm text-muted-foreground">
                    {OBSTACLE_TYPES.find(t => t.value === selectedObstacle.type)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Difficulté :</span>
                  <p className="text-sm text-muted-foreground">
                    {selectedObstacle.difficulty}/10
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fermer
            </Button>
            {selectedObstacle && (
              <Button onClick={() => {
                setIsPreviewOpen(false)
                handleEdit(selectedObstacle)
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}