export interface Bootcamp {
  id: string
  title: string
  description: string | null
  image_url: string | null
  location_name: string
  location_address: string | null
  lat: number | null
  lng: number | null
  starts_at: string
  created_at: string
  updated_at: string
  /** Nombre d'inscrits — agrégat joint côté API */
  registration_count?: number
  /** true si l'utilisateur courant est inscrit */
  is_registered?: boolean
}

export interface BootcampRegistration {
  id: string
  bootcamp_id: string
  user_id: string
  registered_at: string
}

export interface BootcampWithRegistrants extends Bootcamp {
  registrants: Array<{
    id: string
    user_id: string
    registered_at: string
    profile?: {
      full_name: string | null
      email: string | null
    }
  }>
}

export type BootcampFormValues = Pick<
  Bootcamp,
  'title' | 'description' | 'image_url' | 'location_name' | 'location_address' | 'lat' | 'lng' | 'starts_at'
>
