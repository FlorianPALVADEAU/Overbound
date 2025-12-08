import { Timestamp, UUID } from './base.type'

export type PromotionType = 'banner' | 'popup'
export type PopupTheme = 'default' | 'dark' | 'colorful'

export interface PopupConfig {
  // Contenu
  form_title: string
  form_description: string

  // Formulaire
  email_placeholder?: string
  name_placeholder?: string
  submit_button_text: string
  success_message?: string

  // Comportement
  show_close_button: boolean
  backdrop_dismissible: boolean
  delay_ms?: number // Délai avant affichage en ms

  // Style (futur)
  background_image_url?: string
  theme?: PopupTheme
}

export interface Promotion {
  id: UUID
  type: PromotionType
  title: string
  description: string
  link_url: string
  link_text: string
  starts_at: Timestamp
  ends_at: Timestamp
  is_active: boolean
  popup_config: PopupConfig | null
  created_at: Timestamp
  updated_at: Timestamp
}

export interface CreatePromotionData {
  type: PromotionType
  title: string
  description: string
  link_url: string
  link_text: string
  starts_at: string
  ends_at: string
  is_active: boolean
  popup_config?: PopupConfig | null
}

export interface UpdatePromotionData extends Partial<CreatePromotionData> {}

// Helper type guards
export function isPopupPromotion(promotion: Promotion): promotion is Promotion & { popup_config: PopupConfig } {
  return promotion.type === 'popup' && promotion.popup_config !== null
}

export function isBannerPromotion(promotion: Promotion): boolean {
  return promotion.type === 'banner'
}
