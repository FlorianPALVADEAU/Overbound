import { Order } from '@stripe/stripe-js'
import { Event } from './Event'
import { Obstacle } from './Obstacle'
import { Profile } from './Profile'
import { Race } from './Race'
import { Registration } from './Registration'
import { Ticket } from './Ticket'

export type UUID = string
export type Timestamp = string

export type EventStatus =
  | 'draft'
  | 'on_sale'
  | 'sold_out'
  | 'closed'
  | 'cancelled'
  | 'completed'

export type OrderStatus = 'paid' | 'pending' | 'cancelled' | 'refunded'
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'transferred'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'user' | 'volunteer' | 'admin'
export type Provider = 'internal' | 'stripe' | 'paypal' | 'external'
export type ObstacleType =
  | 'force'
  | 'agilité'
  | 'technique'
  | 'endurance'
  | 'mental'
  | 'équilibre'
  | 'vitesse'
export type RaceType = 'trail' | 'obstacle' | 'urbain' | 'nature' | 'extreme'
export type TargetPublic =
  | 'débutant'
  | 'intermédiaire'
  | 'expert'
  | 'famille'
  | 'elite'
  | 'pro'
export type Currency = 'eur' | 'usd' | 'gbp'
export type DocumentType =
  | 'sports_license'
  | 'medical_certificate'
  | 'insurance'
  | 'identity'
  | 'id_document'
  | 'parental_authorization'

export type CreateObstacle = Omit<Obstacle, 'id' | 'created_at' | 'updated_at'>
export type CreateRace = Omit<Race, 'id' | 'created_at' | 'updated_at'>
export type CreateEvent = Omit<Event, 'id' | 'created_at' | 'updated_at'>
export type CreateTicket = Omit<Ticket, 'id' | 'created_at' | 'updated_at'>
export type CreateOrder = Omit<Order, 'id' | 'created_at'>
export type CreateRegistration = Omit<Registration, 'id' | 'created_at'>
export type CreateProfile = Omit<Profile, 'created_at'>

export type UpdateObstacle = Partial<Omit<Obstacle, 'id' | 'created_at'>> & { id: UUID }
export type UpdateRace = Partial<Omit<Race, 'id' | 'created_at'>> & { id: UUID }
export type UpdateEvent = Partial<Omit<Event, 'id' | 'created_at'>> & { id: UUID }
export type UpdateTicket = Partial<Omit<Ticket, 'id' | 'created_at'>> & { id: UUID }
export type UpdateOrder = Partial<Omit<Order, 'id' | 'created_at'>> & { id: UUID }
export type UpdateRegistration =
  Partial<Omit<Registration, 'id' | 'created_at'>> & { id: UUID }
export type UpdateProfile = Partial<Omit<Profile, 'id' | 'created_at'>> & { id: UUID }
