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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock } from 'lucide-react'
import type { PromotionType, PopupConfig } from '@/types/Promotion'

export interface PromotionFormValues {
  type: PromotionType
  title: string
  description: string
  link_url: string
  link_text: string
  starts_at: string
  ends_at: string
  is_active: boolean
  popup_config: PopupConfig | null
}

interface PromotionFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues: PromotionFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PromotionFormValues) => void
}

const DEFAULT_POPUP_CONFIG: PopupConfig = {
  form_title: 'Rejoins la communauté OverBound !',
  form_description: 'Reçois en exclusivité nos nouveaux événements et promotions',
  email_placeholder: 'ton@email.com',
  name_placeholder: 'Ton prénom',
  submit_button_text: "Je m'inscris",
  success_message: 'Merci ! On te tient au courant 🎯',
  show_close_button: true,
  backdrop_dismissible: true,
  delay_ms: 2000,
}

const DEFAULT_VALUES: PromotionFormValues = {
  type: 'banner',
  title: '',
  description: '',
  link_url: '',
  link_text: "Découvrir l'offre",
  starts_at: '',
  ends_at: '',
  is_active: true,
  popup_config: null,
}

export function PromotionFormDialog({
  open,
  mode,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: PromotionFormDialogProps) {
  const [values, setValues] = useState<PromotionFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'

  const dialogTitle = useMemo(
    () => (isCreateMode ? 'Créer une promotion' : 'Modifier la promotion'),
    [isCreateMode],
  )

  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Créez une bannière promotionnelle ou un popup pour capturer des emails.'
        : 'Mettez à jour cette promotion.',
    [isCreateMode],
  )

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const handleChange = (field: keyof PromotionFormValues, value: string | boolean | PromotionType) => {
    setValues((prev) => {
      // When switching to popup type, initialize popup_config
      if (field === 'type' && value === 'popup' && !prev.popup_config) {
        return { ...prev, [field]: value, popup_config: { ...DEFAULT_POPUP_CONFIG } }
      }
      // When switching to banner type, clear popup_config
      if (field === 'type' && value === 'banner') {
        return { ...prev, [field]: value, popup_config: null }
      }
      return { ...prev, [field]: value }
    })
  }

  const handlePopupConfigChange = (field: keyof PopupConfig, value: string | boolean | number) => {
    setValues((prev) => {
      if (!prev.popup_config) return prev
      return {
        ...prev,
        popup_config: {
          ...prev.popup_config,
          [field]: value,
        },
      }
    })
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  const isPopup = values.type === 'popup'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Tabs value={values.type} onValueChange={(value) => handleChange('type', value as PromotionType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="banner">Bannière</TabsTrigger>
            <TabsTrigger value="popup">Popup</TabsTrigger>
          </TabsList>

          <TabsContent value="banner" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Bannière affichée sous le header du site.
            </p>
          </TabsContent>

          <TabsContent value="popup" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Popup modale pour capturer des emails (affichée uniquement aux visiteurs non connectés).
            </p>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="promotion-title">Titre *</Label>
            <Input
              id="promotion-title"
              value={values.title}
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="Nom de l'offre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion-description">Description *</Label>
            <Textarea
              id="promotion-description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion-link">
              Lien * {isPopup && <span className="text-xs text-muted-foreground">(utilisé pour référence uniquement)</span>}
            </Label>
            <Input
              id="promotion-link"
              value={values.link_url}
              onChange={(event) => handleChange('link_url', event.target.value)}
              placeholder="https://overbound-race.com/offre"
            />
          </div>

          {!isPopup && (
            <div className="space-y-2">
              <Label htmlFor="promotion-link-text">Texte du lien *</Label>
              <Input
                id="promotion-link-text"
                value={values.link_text}
                onChange={(event) => handleChange('link_text', event.target.value)}
                placeholder="Découvrir l'offre"
              />
            </div>
          )}

          {isPopup && values.popup_config && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Configuration du popup</h3>

              <div className="space-y-2">
                <Label htmlFor="popup-form-title">Titre du formulaire *</Label>
                <Input
                  id="popup-form-title"
                  value={values.popup_config.form_title}
                  onChange={(e) => handlePopupConfigChange('form_title', e.target.value)}
                  placeholder="Rejoins la communauté !"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-form-description">Description *</Label>
                <Textarea
                  id="popup-form-description"
                  value={values.popup_config.form_description}
                  onChange={(e) => handlePopupConfigChange('form_description', e.target.value)}
                  rows={2}
                  placeholder="Reçois en exclusivité nos nouveaux événements"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="popup-email-placeholder">Placeholder email</Label>
                  <Input
                    id="popup-email-placeholder"
                    value={values.popup_config.email_placeholder || ''}
                    onChange={(e) => handlePopupConfigChange('email_placeholder', e.target.value)}
                    placeholder="ton@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="popup-name-placeholder">Placeholder prénom</Label>
                  <Input
                    id="popup-name-placeholder"
                    value={values.popup_config.name_placeholder || ''}
                    onChange={(e) => handlePopupConfigChange('name_placeholder', e.target.value)}
                    placeholder="Ton prénom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-submit-text">Texte du bouton *</Label>
                <Input
                  id="popup-submit-text"
                  value={values.popup_config.submit_button_text}
                  onChange={(e) => handlePopupConfigChange('submit_button_text', e.target.value)}
                  placeholder="Je m'inscris"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-success-message">Message de succès</Label>
                <Input
                  id="popup-success-message"
                  value={values.popup_config.success_message || ''}
                  onChange={(e) => handlePopupConfigChange('success_message', e.target.value)}
                  placeholder="Merci ! On te tient au courant 🎯"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-delay">Délai d'affichage (ms)</Label>
                <Input
                  id="popup-delay"
                  type="number"
                  value={values.popup_config.delay_ms || 0}
                  onChange={(e) => handlePopupConfigChange('delay_ms', parseInt(e.target.value) || 0)}
                  placeholder="2000"
                />
                <p className="text-xs text-muted-foreground">
                  Temps d'attente avant l'affichage du popup (en millisecondes)
                </p>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Bouton de fermeture</p>
                  <p className="text-xs text-muted-foreground">
                    Afficher un bouton X pour fermer le popup
                  </p>
                </div>
                <Switch
                  checked={values.popup_config.show_close_button}
                  onCheckedChange={(checked) => handlePopupConfigChange('show_close_button', checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Fermeture au clic extérieur</p>
                  <p className="text-xs text-muted-foreground">
                    Permettre de fermer en cliquant en dehors du popup
                  </p>
                </div>
                <Switch
                  checked={values.popup_config.backdrop_dismissible}
                  onCheckedChange={(checked) => handlePopupConfigChange('backdrop_dismissible', checked)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promotion-starts">Début *</Label>
              <Input
                id="promotion-starts"
                type="datetime-local"
                value={values.starts_at}
                onChange={(event) => handleChange('starts_at', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotion-ends">Fin *</Label>
              <Input
                id="promotion-ends"
                type="datetime-local"
                value={values.ends_at}
                onChange={(event) => handleChange('ends_at', event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Promotion active</p>
              <p className="text-xs text-muted-foreground">
                Les promotions inactives ne seront pas affichées publiquement.
              </p>
            </div>
            <Switch
              checked={values.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
