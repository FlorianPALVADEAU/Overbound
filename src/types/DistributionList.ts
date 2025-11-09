/**
 * Type de liste de distribution
 */
export type DistributionListType =
  | 'marketing'
  | 'transactional'
  | 'events'
  | 'volunteers'
  | 'partners'
  | 'news'
  | 'blog'

/**
 * Liste de distribution
 */
export interface DistributionList {
  id: string
  name: string
  description: string | null
  slug: string
  type: DistributionListType
  default_subscribed: boolean
  active: boolean
  created_at: string
  updated_at: string
}

/**
 * Liste de distribution avec statistiques
 */
export interface DistributionListWithStats extends DistributionList {
  subscriber_count: number
  unsubscriber_count: number
  total_interactions: number
}

/**
 * Données pour créer une liste de distribution
 */
export interface CreateDistributionListData {
  name: string
  description?: string | null
  slug: string
  type: DistributionListType
  default_subscribed?: boolean
  active?: boolean
}

/**
 * Données pour mettre à jour une liste de distribution
 */
export interface UpdateDistributionListData {
  name?: string
  description?: string | null
  slug?: string
  type?: DistributionListType
  default_subscribed?: boolean
  active?: boolean
}

/**
 * Source d'abonnement
 */
export type SubscriptionSource =
  | 'signup'
  | 'event_registration'
  | 'manual'
  | 'import'
  | 'admin'
  | 'preferences_page'
  | 'migration_marketing_opt_in'

/**
 * Abonnement à une liste
 */
export interface ListSubscription {
  id: string
  user_id: string
  list_id: string
  subscribed: boolean
  source: SubscriptionSource | null
  subscription_ip: string | null
  subscribed_at: string | null
  unsubscribed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Abonnement avec informations de la liste
 */
export interface ListSubscriptionWithList extends ListSubscription {
  list: DistributionList
}

/**
 * Abonnement avec informations de l'utilisateur
 */
export interface ListSubscriptionWithUser extends ListSubscription {
  user: {
    id: string
    email: string
    full_name: string | null
  }
}

/**
 * Données pour créer un abonnement
 */
export interface CreateSubscriptionData {
  user_id: string
  list_id: string
  subscribed?: boolean
  source?: SubscriptionSource
  subscription_ip?: string | null
}

/**
 * Données pour mettre à jour un abonnement
 */
export interface UpdateSubscriptionData {
  subscribed: boolean
  source?: SubscriptionSource
}

/**
 * Préférences d'abonnement pour un utilisateur
 */
export interface UserListPreferences {
  user_id: string
  subscriptions: {
    [listSlug: string]: boolean
  }
}
