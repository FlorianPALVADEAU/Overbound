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
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  Mountain,
  Target,
  Star
} from 'lucide-react'

interface Obstacle {
  id: string
  name: string
  type: string
  difficulty: number
  description: string
  image_url?: string
}

interface Race {
  id: string
  name: string
  logo_url?: string
  type: string
  difficulty: number
  target_public: string
  distance_km: number
  description?: string
  created_at: string
  obstacles?: Array<{
    obstacle: Obstacle
    order_position: number
    is_mandatory: boolean
  }>
}

interface RaceFormData {
  name: string
  logo_url: string
  type: string
  difficulty: string
  target_public: string
  distance_km: string
  description: string
  obstacle_ids: string[]
}

const RACE_TYPES = [
  { value: 'trail', label: 'Trail' },
  { value: 'obstacle', label: 'Course d\'obstacles' },
  { value: 'urbain', label: 'Course urbaine' },
  { value: 'nature', label: 'Course nature' },
  { value: 'extreme', label: 'Course extrême' }
]

const TARGET_PUBLICS = [
  { value: 'débutant', label: 'Débutant' },
  { value: 'intermédiaire', label: 'Intermédiaire' },
  { value: 'expert', label: 'Expert' },
  { value: 'famille', label: 'Famille' },
  { value: 'pro', label: 'Professionnel' }
]

export function AdminRacesCrud() {
  const [races, setRaces] = useState<Race[]>([])
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState<RaceFormData>({
    name: '',
    logo_url: '',
    type: 'trail',
    difficulty: '5',
    target_public: 'intermédiaire',
    distance_km: '10',
    description: '',
    obstacle_ids: []
  })

  // Charger les données
  const loadData = async () => {
    try {
      const [racesRes, obstaclesRes] = await Promise.all([
        fetch('/api/admin/races'),
        fetch('/api/admin/obstacles')
      ])
      
      if (!racesRes.ok || !obstaclesRes.ok) {
        throw new Error('Erreur de chargement')
      }
      
      const [racesData, obstaclesData] = await Promise.all([
        racesRes.json(),
        obstaclesRes.json()
      ])
      
      setRaces(racesData.races || [])
      setObstacles(obstaclesData.obstacles || [])
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      type: 'trail',
      difficulty: '5',
      target_public: 'intermédiaire',
      distance_km: '10',
      description: '',
      obstacle_ids: []
    })
    setSelectedRace(null)
    setIsCreateMode(false)
  }

  // Ouvrir le dialogue pour créer
  const handleCreate = () => {
    resetForm()
    setIsCreateMode(true)
    setIsDialogOpen(true)
  }

  // Ouvrir le dialogue pour éditer
  const handleEdit = (race: Race) => {
    setSelectedRace(race)
    setFormData({
      name: race.name,
      logo_url: race.logo_url || '',
      type: race.type,
      difficulty: race.difficulty.toString(),
      target_public: race.target_public,
      distance_km: race.distance_km.toString(),
      description: race.description || '',
      obstacle_ids: race.obstacles?.map(o => o.obstacle.id) || []
    })
    setIsCreateMode(false)
    setIsDialogOpen(true)
  }

  // Gérer les changements du formulaire
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Gérer la sélection d'obstacles
  const handleObstacleToggle = (obstacleId: string) => {
    setFormData(prev => ({
      ...prev,
      obstacle_ids: prev.obstacle_ids.includes(obstacleId)
        ? prev.obstacle_ids.filter(id => id !== obstacleId)
        : [...prev.obstacle_ids, obstacleId]
    }))
  }

  // Sauvegarder la course
  const handleSave = async () => {
    if (!formData.name || !formData.distance_km) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const method = isCreateMode ? 'POST' : 'PUT'
      const url = isCreateMode ? '/api/admin/races' : `/api/admin/races/${selectedRace?.id}`
      
      const dataToSend = {
        ...formData,
        difficulty: parseInt(formData.difficulty),
        distance_km: parseFloat(formData.distance_km),
        logo_url: formData.logo_url || null
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
        setRaces(prev => [result.race, ...prev])
        setMessage({ type: 'success', text: 'Course créée avec succès' })
      } else {
        setRaces(prev => prev.map(r => r.id === selectedRace?.id ? result.race : r))
        setMessage({ type: 'success', text: 'Course mise à jour avec succès' })
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

  // Supprimer une course
  const handleDelete = async (race: Race) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${race.name}" ?`)) {
      return
    }

    setDeleteLoading(race.id)
    try {
      const response = await fetch(`/api/admin/races/${race.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setRaces(prev => prev.filter(r => r.id !== race.id))
      setMessage({ type: 'success', text: 'Course supprimée avec succès' })

    } catch (error: any) {
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Chargement des courses...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des courses</h2>
          <p className="text-muted-foreground">
            Créer et gérer les différents types de courses et leurs obstacles
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle course
        </Button>
      </div>

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

      {/* Liste des courses */}
      <div className="grid gap-4">
        {races.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune course</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première course
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une course
              </Button>
            </CardContent>
          </Card>
        ) : (
          races.map((race) => (
            <Card key={race.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {race.logo_url && (
                        <img 
                          src={race.logo_url} 
                          alt={race.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <h3 className="text-lg font-semibold truncate">{race.name}</h3>
                      <Badge variant="outline" className={getTypeColor(race.type)}>
                        {RACE_TYPES.find(t => t.value === race.type)?.label || race.type}
                      </Badge>
                      <Badge variant="outline" className={getDifficultyColor(race.difficulty)}>
                        <Star className="h-3 w-3 mr-1" />
                        {race.difficulty}/10
                      </Badge>
                    </div>
                    
                    {race.description && (
                      <p className="text-sm text-muted-foreground mb-3">{race.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Mountain className="h-4 w-4 text-muted-foreground" />
                        <span>{race.distance_km} km</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className={getPublicColor(race.target_public)}>
                          {TARGET_PUBLICS.find(p => p.value === race.target_public)?.label || race.target_public}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {race.obstacles?.length || 0} obstacle(s)
                        </span>
                      </div>
                    </div>

                    {race.obstacles && race.obstacles.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Obstacles:</span>
                        <div className="flex flex-wrap gap-1">
                          {race.obstacles.slice(0, 5).map(({ obstacle }) => (
                            <Badge key={obstacle.id} variant="secondary" className="text-xs">
                              {obstacle.name}
                            </Badge>
                          ))}
                          {race.obstacles.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{race.obstacles.length - 5} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(race)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(race)}
                      disabled={deleteLoading === race.id}
                    >
                      {deleteLoading === race.id ? (
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Créer une course' : 'Modifier la course'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Créez un nouveau type de course avec ses caractéristiques'
                : 'Modifiez les informations de cette course'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la course *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ex: Spartan Race, Trail des Collines..."
              />
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL du logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => handleFormChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Type, Difficulté, Public cible */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de course *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: string) => handleFormChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RACE_TYPES.map(type => (
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

              <div className="space-y-2">
                <Label htmlFor="target_public">Public cible *</Label>
                <Select 
                  value={formData.target_public} 
                  onValueChange={(value: string) => handleFormChange('target_public', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_PUBLICS.map(target => (
                      <SelectItem key={target.value} value={target.value}>
                        {target.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <Label htmlFor="distance_km">Distance (en km) *</Label>
              <Input
                id="distance_km"
                type="number"
                step="0.1"
                min="0"
                value={formData.distance_km}
                onChange={(e) => handleFormChange('distance_km', e.target.value)}
                placeholder="10.5"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description de la course, ses spécificités..."
                rows={3}
              />
            </div>

            {/* Sélection des obstacles */}
            <div className="space-y-4">
              <Label>Obstacles inclus</Label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                {obstacles.map(obstacle => (
                  <div key={obstacle.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`obstacle-${obstacle.id}`}
                      checked={formData.obstacle_ids.includes(obstacle.id)}
                      onChange={() => handleObstacleToggle(obstacle.id)}
                      className="rounded border-gray-300"
                    />
                    <Label 
                      htmlFor={`obstacle-${obstacle.id}`} 
                      className="text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <span>{obstacle.name}</span>
                      <Badge variant="outline" className={getDifficultyColor(obstacle.difficulty)}>
                        {obstacle.difficulty}/10
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {obstacle.type}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.obstacle_ids.length} obstacle(s) sélectionné(s)
              </p>
            </div>
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
    </div>
  )
}