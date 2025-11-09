/**
 * Notification Preferences Types
 * Defines types for granular email notification preferences
 */

export type DigestFrequency = 'immediate' | 'daily' | 'weekly' | 'never'

export interface NotificationPreferences {
  id: string
  user_id: string

  // Marketing email types
  events_announcements: boolean
  price_alerts: boolean
  news_blog: boolean
  volunteers_opportunities: boolean
  partner_offers: boolean

  // Frequency preference
  digest_frequency: DigestFrequency

  // Transactional emails (always on)
  registration_confirmations: boolean
  ticket_updates: boolean
  account_security: boolean

  // Metadata
  created_at: string
  updated_at: string
}

export interface NotificationPreferencesWithUser extends NotificationPreferences {
  email: string
  full_name?: string | null
}

export interface UpdateNotificationPreferencesData {
  events_announcements?: boolean
  price_alerts?: boolean
  news_blog?: boolean
  volunteers_opportunities?: boolean
  partner_offers?: boolean
  digest_frequency?: DigestFrequency
}

export interface NotificationPreferenceToggle {
  key: keyof Pick<
    NotificationPreferences,
    | 'events_announcements'
    | 'price_alerts'
    | 'news_blog'
    | 'volunteers_opportunities'
    | 'partner_offers'
  >
  label: string
  description: string
}

export const NOTIFICATION_PREFERENCE_TOGGLES: NotificationPreferenceToggle[] = [
  {
    key: 'events_announcements',
    label: 'Annonces d\'événements',
    description: 'Recevez des emails sur les nouveaux événements OverBound',
  },
  {
    key: 'price_alerts',
    label: 'Alertes de prix',
    description: 'Recevez des notifications sur les changements de prix et promotions',
  },
  {
    key: 'news_blog',
    label: 'Actualités et blog',
    description: 'Recevez les dernières actualités et articles du blog',
  },
  {
    key: 'volunteers_opportunities',
    label: 'Opportunités de bénévolat',
    description: 'Recevez des informations sur les opportunités de bénévolat',
  },
  {
    key: 'partner_offers',
    label: 'Offres partenaires',
    description: 'Recevez des offres spéciales de nos partenaires',
  },
]

export const DIGEST_FREQUENCY_OPTIONS: { value: DigestFrequency; label: string }[] = [
  { value: 'immediate', label: 'Immédiat (dès qu\'un email est disponible)' },
  { value: 'daily', label: 'Quotidien (une fois par jour)' },
  { value: 'weekly', label: 'Hebdomadaire (une fois par semaine)' },
  { value: 'never', label: 'Jamais (aucun email marketing)' },
]
