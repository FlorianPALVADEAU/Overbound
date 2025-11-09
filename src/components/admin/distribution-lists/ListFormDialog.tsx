'use client'

import { useState, useEffect } from 'react'
import { useDistributionLists } from '@/hooks/useDistributionLists'
import type {
  DistributionList,
  DistributionListType,
  CreateDistributionListData,
} from '@/types/DistributionList'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

interface ListFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  list?: DistributionList // If provided, edit mode
  onSuccess: () => void
}

export function ListFormDialog({
  open,
  onOpenChange,
  list,
  onSuccess,
}: ListFormDialogProps) {
  const { createList, updateList } = useDistributionLists()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [type, setType] = useState<DistributionListType>('marketing')
  const [defaultSubscribed, setDefaultSubscribed] = useState(false)
  const [active, setActive] = useState(true)

  // Load list data when editing
  useEffect(() => {
    if (list) {
      setName(list.name)
      setDescription(list.description || '')
      setSlug(list.slug)
      setType(list.type)
      setDefaultSubscribed(list.default_subscribed)
      setActive(list.active)
    } else {
      // Reset form for create mode
      setName('')
      setDescription('')
      setSlug('')
      setType('marketing')
      setDefaultSubscribed(false)
      setActive(true)
    }
    setError(null)
  }, [list, open])

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!list) {
      // Only auto-generate slug in create mode
      const autoSlug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(autoSlug)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const data: CreateDistributionListData = {
        name,
        description: description || null,
        slug,
        type,
        default_subscribed: defaultSubscribed,
        active,
      }

      if (list) {
        await updateList(list.id, data)
      } else {
        await createList(data)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {list ? 'Modifier la liste' : 'Nouvelle liste de distribution'}
          </DialogTitle>
          <DialogDescription>
            {list
              ? 'Modifiez les informations de la liste de distribution'
              : 'Créez une nouvelle liste de distribution pour segmenter vos emails'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Annonces d'événements"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le type de contenu envoyé via cette liste..."
                rows={3}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="events-announcements"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Uniquement des lettres minuscules, chiffres et tirets"
              />
              <p className="text-xs text-muted-foreground">
                Identifiant unique utilisé dans le code (ex: events-announcements)
              </p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select value={type} onValueChange={(value) => setType(value as DistributionListType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="events">Événements</SelectItem>
                  <SelectItem value="news">Actualités</SelectItem>
                  <SelectItem value="volunteers">Bénévoles</SelectItem>
                  <SelectItem value="partners">Partenaires</SelectItem>
                  <SelectItem value="transactional">Transactionnel</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Subscribed */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="default-subscribed" className="cursor-pointer">
                  Abonnement par défaut
                </Label>
                <p className="text-sm text-muted-foreground">
                  Les nouveaux utilisateurs sont automatiquement abonnés
                </p>
              </div>
              <Switch
                id="default-subscribed"
                checked={defaultSubscribed}
                onCheckedChange={setDefaultSubscribed}
              />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="cursor-pointer">
                  Liste active
                </Label>
                <p className="text-sm text-muted-foreground">
                  Désactiver temporairement cette liste
                </p>
              </div>
              <Switch
                id="active"
                checked={active}
                onCheckedChange={setActive}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {list ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
