import { Timestamp, UUID } from './base.type'

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'never'

export interface NotificationPreference {
  id: UUID
  user_id: UUID
  email_marketing: boolean
  email_event_updates: boolean
  email_registration_updates: boolean
  sms_reminders: boolean
  push_notifications: boolean
  frequency_events: NotificationFrequency
  created_at: Timestamp
  updated_at: Timestamp
}
