'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Clock } from 'lucide-react'
import type { Event } from '@/types/Event'
import type { Race } from '@/types/Race'
import type { Ticket } from '@/types/Ticket'

export interface TicketFormValues {
  event_id: string
  race_id: string
  name: string
  description: string
  price: string
  currency: Ticket['currency']
  max_participants: string
  requires_document: boolean
  document_types: string[]
}

interface TicketFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  events: Event[]
  races: Race[]
  initialValues: TicketFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TicketFormValues) => void
}

const DOCUMENT_TYPES = [
  { value: 'medical_certificate', label: 'Certificat médical' },
  { value: 'sports_license', label: 'Licence sportive' },
  { value: 'insurance', label: "Attestation d'assurance" },
  { value: 'id_document', label: "Pièce d'identité" },
  { value: 'parental_authorization', label: 'Autorisation parentale' },
]

const DEFAULT_VALUES: TicketFormValues = {
  event_id: '',
  race_id: 'none',
  name: '',
  description: '',
  price: '0',
  currency: 'eur',
  max_participants: '0',
  requires_document: false,
  document_types: [],
}

export function TicketFormDialog({
  open,
  mode,
  events,
  races,
  initialValues,
  loading,
  onOpenChange,
  onSubmit,
}: TicketFormDialogProps) {
  const [values, setValues] = useState<TicketFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const dialogTitle = useMemo(() => (isCreateMode ? 'Créer un ticket' : 'Modifier le ticket'), [isCreateMode])
  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Configurez un nouveau ticket pour vos événements.'
        : 'Mettez à jour les informations de ce ticket.',
    [isCreateMode]
  )

  const handleChange = (field: keyof TicketFormValues, value: TicketFormValues[keyof TicketFormValues]) => {
    setValues((prev) => ({ ...prev, [field]: value as any }))
  }

  const toggleDocumentType = (docType: string) => {
    setValues((prev) => ({
      ...prev,
      document_types: prev.document_types.includes(docType)
        ? prev.document_types.filter((entry) => entry !== docType)
        : [...prev.document_types, docType],
    }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!w-screen max-h-[90vh] overflow-y-auto"
        style={{ 
          maxWidth: '1000px'

         }}
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-event">Événement *</Label>
            <Select value={values.event_id} onValueChange={(value) => handleChange('event_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un événement" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-race">Course associée</Label>
            <Select value={values.race_id} onValueChange={(value) => handleChange('race_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {races.map((race) => (
                  <SelectItem key={race.id} value={race.id}>
                    {race.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-name">Nom *</Label>
            <Input
              id="ticket-name"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Ex: Dossard premium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-currency">Devise *</Label>
              <Select value={values.currency ?? 'eur'} onValueChange={(value) => handleChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-max">Participants max *</Label>
              <Input
                id="ticket-max"
                type="number"
                min="0"
                value={values.max_participants}
                onChange={(event) => handleChange('max_participants', event.target.value)}
              />
            </div>
          </div>

          {/* Price field */}
          <div className="space-y-2">
            <Label htmlFor="ticket-price">Prix final (centimes) *</Label>
            <p className="text-sm text-muted-foreground">
              Ce prix correspond au prix final (sans réduction). Les paliers de réduction sont gérés au niveau de l'événement.
            </p>
            <Input
              id="ticket-price"
              type="number"
              min="0"
              value={values.price}
              onChange={(event) => handleChange('price', event.target.value)}
              placeholder="10000 = 100€"
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">Documents requis</h4>
                <p className="text-sm text-muted-foreground">
                  Activez si des documents doivent être fournis pour ce billet.
                </p>
              </div>
              <Switch
                checked={values.requires_document}
                onCheckedChange={(checked) => handleChange('requires_document', Boolean(checked))}
              />
            </div>

            {values.requires_document && (
              <div className="grid md:grid-cols-2 gap-3">
                {DOCUMENT_TYPES.map((docType) => (
                  <label
                    key={docType.value}
                    htmlFor={`doc-${docType.value}`}
                    className="flex items-center space-x-2 rounded border p-3 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`doc-${docType.value}`}
                      checked={values.document_types.includes(docType.value)}
                      onCheckedChange={() => toggleDocumentType(docType.value)}
                    />
                    <span className="text-sm">{docType.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              (values.requires_document && values.document_types.length === 0)
            }
          >
            {loading ? (
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
  )
}

TicketFormDialog.defaultProps = {
  loading: false,
}
