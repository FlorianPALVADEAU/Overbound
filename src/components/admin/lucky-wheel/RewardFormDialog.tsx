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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
  LuckyWheelCommercialPhase,
  LuckyWheelRewardPayload,
  LuckyWheelRewardType,
} from '@/app/api/admin/lucky-wheel/luckyWheelQueries'

// PRODUCT_DISCOUNT / PHOTO_DISCOUNT re-enabled 2026-09-26 (FDR-0014 addendum,
// product-line discounts, stage 4), then split 2026-09-27: a real reward
// configured as "-5€ sur pack photo" under the unsuffixed PHOTO_DISCOUNT
// had its public_value silently read as a *percentage* (0,90€ off instead
// of 5,00€) -- the type alone never said which unit was intended. Split
// into explicit *_PERCENT_/*_FIXED_ variants, mirroring the ticket pattern
// (TICKET_PERCENT_DISCOUNT/TICKET_FIXED_DISCOUNT). The old unsuffixed
// values are kept here, disabled, only so a reward still saved under one
// (not yet corrected by an admin) shows what it currently is when opened
// for edit -- selecting it again is blocked, the admin must pick a
// %/montant variant to save.
const REWARD_TYPES: { value: LuckyWheelRewardType; label: string; disabled?: boolean }[] = [
  { value: 'TICKET_PERCENT_DISCOUNT', label: 'Remise billet (%)' },
  { value: 'TICKET_FIXED_DISCOUNT', label: 'Remise billet (montant)' },
  { value: 'FREE_TICKET', label: 'Billet offert' },
  { value: 'FREE_PRODUCT', label: 'Produit offert' },
  { value: 'PRODUCT_PERCENT_DISCOUNT', label: 'Remise produit (%)' },
  { value: 'PRODUCT_FIXED_DISCOUNT', label: 'Remise produit (montant)' },
  { value: 'PHOTO_PERCENT_DISCOUNT', label: 'Remise pack photo (%)' },
  { value: 'PHOTO_FIXED_DISCOUNT', label: 'Remise pack photo (montant)' },
  { value: 'PRODUCT_DISCOUNT', label: 'Remise produit -- ancien format, à corriger', disabled: true },
  { value: 'PHOTO_DISCOUNT', label: 'Remise pack photo -- ancien format, à corriger', disabled: true },
  { value: 'FREE_PHOTO_PACK', label: 'Pack photo offert' },
  { value: 'CUSTOM', label: 'Personnalisé' },
]

// FREE_PRODUCT/FREE_PHOTO_PACK joined 2026-09-27: a 100%-off code still
// needs to know which upsell it's 100% off (same fix as FREE_TICKET, which
// was also never actually minting a code -- see redemption.ts header).
const PRODUCT_SCOPED_REWARD_TYPES = new Set<LuckyWheelRewardType>([
  'PRODUCT_PERCENT_DISCOUNT',
  'PRODUCT_FIXED_DISCOUNT',
  'PHOTO_PERCENT_DISCOUNT',
  'PHOTO_FIXED_DISCOUNT',
  'FREE_PRODUCT',
  'FREE_PHOTO_PACK',
  // Legacy, disabled above but still shown here so the "produit ciblé"
  // field stays visible/prefilled if a not-yet-corrected reward is opened.
  'PRODUCT_DISCOUNT',
  'PHOTO_DISCOUNT',
])

// These reward types are always a 100%-off code -- "Valeur perçue" doesn't
// apply to them (there's no "how much free" to configure), so the field is
// hidden entirely rather than left confusingly present.
const FULLY_FREE_REWARD_TYPES = new Set<LuckyWheelRewardType>(['FREE_TICKET', 'FREE_PRODUCT', 'FREE_PHOTO_PACK'])

const ALL_PHASES: LuckyWheelCommercialPhase[] = ['LAUNCH', 'STANDARD', 'HIGH_DEMAND']

export interface RewardFormValues {
  name: string
  type: LuckyWheelRewardType
  weight: string
  stock: string
  max_wins: string
  public_value: string
  estimated_cost: string
  commercial_phases: LuckyWheelCommercialPhase[]
  enabled: boolean
  image_url: string
  target_upsell_id: string
}

interface UpsellOption {
  id: string
  name: string
}

interface RewardFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  campaignId: string
  initialValues: RewardFormValues
  loading?: boolean
  upsellOptions?: UpsellOption[]
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: LuckyWheelRewardPayload) => void
}

export const DEFAULT_REWARD_FORM_VALUES: RewardFormValues = {
  name: '',
  type: 'FREE_PRODUCT',
  weight: '10',
  stock: '',
  max_wins: '',
  public_value: '',
  estimated_cost: '',
  commercial_phases: [...ALL_PHASES],
  enabled: true,
  image_url: '',
  target_upsell_id: '',
}

// FDR-0014 §5/§10: reward config. stock/max_wins/weight blank = unlimited
// (§4) -- kept as free-text so "illimité" doesn't require a separate toggle.
export function RewardFormDialog({
  open,
  mode,
  campaignId,
  initialValues,
  loading,
  upsellOptions = [],
  onOpenChange,
  onSubmit,
}: RewardFormDialogProps) {
  const [values, setValues] = useState<RewardFormValues>(DEFAULT_REWARD_FORM_VALUES)
  const [error, setError] = useState<string | null>(null)
  const isCreateMode = mode === 'create'
  const requiresTargetUpsell = PRODUCT_SCOPED_REWARD_TYPES.has(values.type)

  // The "Valeur perçue" field is the discount_percent / discount_amount
  // source for the minted promo code (mintLuckyWheelPromoCode) -- its unit
  // is now determined entirely by the reward type (2026-09-27: the old
  // unsuffixed PRODUCT_DISCOUNT/PHOTO_DISCOUNT let this be ambiguous, and a
  // real "-5€" reward got silently read as "-5%"). Left blank here
  // silently means "no discount at all" once minted, so the label stays
  // explicit and required for every discount-type reward.
  const PERCENT_TYPES: LuckyWheelRewardType[] = ['TICKET_PERCENT_DISCOUNT', 'PRODUCT_PERCENT_DISCOUNT', 'PHOTO_PERCENT_DISCOUNT']
  const FIXED_TYPES: LuckyWheelRewardType[] = ['TICKET_FIXED_DISCOUNT', 'PRODUCT_FIXED_DISCOUNT', 'PHOTO_FIXED_DISCOUNT']
  const isPercentType = PERCENT_TYPES.includes(values.type)
  const isFixedType = FIXED_TYPES.includes(values.type)
  const isFullyFree = FULLY_FREE_REWARD_TYPES.has(values.type)
  const publicValueLabel = isPercentType
    ? 'Pourcentage de remise (%) *'
    : isFixedType
      ? 'Montant de la remise (€) *'
      : 'Valeur perçue (€, ou % si remise)'
  // FREE_TICKET/FREE_PRODUCT/FREE_PHOTO_PACK are always 100% off -- no
  // value to configure, the field is hidden rather than shown-but-ignored.
  const isDiscountType = (isPercentType || isFixedType) && !isFullyFree

  useEffect(() => {
    setValues(initialValues)
    setError(null)
  }, [initialValues, open])

  const dialogTitle = useMemo(
    () => (isCreateMode ? 'Créer une récompense' : 'Modifier la récompense'),
    [isCreateMode],
  )

  const handleChange = <K extends keyof RewardFormValues>(field: K, value: RewardFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const togglePhase = (phase: LuckyWheelCommercialPhase) => {
    setValues((prev) => ({
      ...prev,
      commercial_phases: prev.commercial_phases.includes(phase)
        ? prev.commercial_phases.filter((p) => p !== phase)
        : [...prev.commercial_phases, phase],
    }))
  }

  const parseOptionalNumber = (raw: string): number | null | 'invalid' => {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    if (Number.isNaN(parsed) || parsed < 0) return 'invalid'
    return parsed
  }

  const handleSubmit = () => {
    if (!values.name.trim()) {
      setError('Le nom est requis')
      return
    }
    if (values.commercial_phases.length === 0) {
      setError('Sélectionnez au moins une phase commerciale')
      return
    }
    const trimmedImageUrl = values.image_url.trim()
    if (trimmedImageUrl && !/^https:\/\//.test(trimmedImageUrl)) {
      setError("L'URL de l'image doit commencer par https://")
      return
    }
    if (requiresTargetUpsell && !values.target_upsell_id) {
      setError('Sélectionnez le produit ciblé par cette remise')
      return
    }
    if (isDiscountType && !values.public_value.trim()) {
      setError('Renseignez la valeur de la remise -- sans elle, le code ne réduira rien.')
      return
    }

    const weight = parseOptionalNumber(values.weight)
    const stock = parseOptionalNumber(values.stock)
    const maxWins = parseOptionalNumber(values.max_wins)
    const publicValue = parseOptionalNumber(values.public_value)
    const estimatedCost = parseOptionalNumber(values.estimated_cost)

    if ([weight, stock, maxWins, publicValue, estimatedCost].includes('invalid')) {
      setError('Les valeurs numériques doivent être positives')
      return
    }

    setError(null)
    onSubmit({
      campaign_id: campaignId,
      name: values.name.trim(),
      type: values.type,
      weight: weight === 'invalid' ? null : weight,
      stock: stock === 'invalid' ? null : stock,
      max_wins: maxWins === 'invalid' ? null : maxWins,
      public_value: publicValue === 'invalid' ? null : publicValue,
      estimated_cost: estimatedCost === 'invalid' ? null : estimatedCost,
      commercial_phases: values.commercial_phases,
      enabled: values.enabled,
      image_url: trimmedImageUrl || null,
      target_upsell_id: requiresTargetUpsell ? values.target_upsell_id : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Poids, stock et nombre de gains max laissés vides = illimité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reward-name">Nom *</Label>
            <Input
              id="reward-name"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Patch Overbound offert"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={values.type} onValueChange={(value) => handleChange('type', value as LuckyWheelRewardType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REWARD_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresTargetUpsell && (
            <div className="space-y-2">
              <Label>Produit ciblé *</Label>
              <Select
                value={values.target_upsell_id}
                onValueChange={(value) => handleChange('target_upsell_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le produit…" />
                </SelectTrigger>
                <SelectContent>
                  {upsellOptions.map((upsell) => (
                    <SelectItem key={upsell.id} value={upsell.id}>
                      {upsell.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isFullyFree
                  ? "Ce produit sera offert gratuitement (100%), jamais le billet. Le produit doit être vendu sur au moins un des événements liés à la campagne."
                  : "La remise ne s'applique qu'à ce produit, jamais au billet. Le produit doit être vendu sur au moins un des événements liés à la campagne."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward-weight">Poids</Label>
              <Input
                id="reward-weight"
                type="number"
                min={0}
                value={values.weight}
                onChange={(event) => handleChange('weight', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-stock">Stock</Label>
              <Input
                id="reward-stock"
                type="number"
                min={0}
                value={values.stock}
                onChange={(event) => handleChange('stock', event.target.value)}
                placeholder="Illimité"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-max-wins">Gains max</Label>
              <Input
                id="reward-max-wins"
                type="number"
                min={0}
                value={values.max_wins}
                onChange={(event) => handleChange('max_wins', event.target.value)}
                placeholder="Illimité"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isFullyFree && (
              <div className="space-y-2">
                <Label htmlFor="reward-public-value">{publicValueLabel}</Label>
                <Input
                  id="reward-public-value"
                  type="number"
                  min={0}
                  max={isPercentType ? 100 : undefined}
                  value={values.public_value}
                  onChange={(event) => handleChange('public_value', event.target.value)}
                />
                {isDiscountType && !values.public_value && (
                  <p className="text-xs text-destructive">
                    Sans valeur, le code généré n'appliquera aucune remise.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reward-estimated-cost">Coût réel estimé (€)</Label>
              <Input
                id="reward-estimated-cost"
                type="number"
                min={0}
                value={values.estimated_cost}
                onChange={(event) => handleChange('estimated_cost', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward-image-url">Image du lot (URL, optionnel)</Label>
            <Input
              id="reward-image-url"
              type="url"
              value={values.image_url}
              onChange={(event) => handleChange('image_url', event.target.value)}
              placeholder="https://…"
            />
            <p className="text-xs text-muted-foreground">
              Affichée sur le segment de la roue et sur l'écran de gain. Sans image, le nom du lot suffit.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Phases commerciales éligibles *</Label>
            <div className="flex gap-4">
              {ALL_PHASES.map((phase) => (
                <div key={phase} className="flex items-center gap-2">
                  <Checkbox
                    id={`reward-phase-${phase}`}
                    checked={values.commercial_phases.includes(phase)}
                    onCheckedChange={() => togglePhase(phase)}
                  />
                  <Label htmlFor={`reward-phase-${phase}`} className="font-normal">
                    {phase}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="reward-enabled"
              checked={values.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
            <Label htmlFor="reward-enabled">Activée</Label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement…' : isCreateMode ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
