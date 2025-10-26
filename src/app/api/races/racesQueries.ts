import { useQuery } from '@tanstack/react-query'

export interface RaceListItem {
  id: string
  name: string
  slug?: string | null
  logo_url?: string | null
  type: string
  difficulty: number
  target_public: string
  distance_km: number | null
  description?: string | null
  obstacles?: Array<{
    order_position: number
    is_mandatory: boolean
    obstacle: {
      id: string
      name: string
      type: string
      difficulty: number
    }
  }>
}

const fetchRaces = async (): Promise<RaceListItem[]> => {
  const response = await fetch('/api/races', { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer les courses')
  }
  return (await response.json()) as RaceListItem[]
}

export const useRaces = () =>
  useQuery<RaceListItem[], Error>({
    queryKey: ['races'],
    queryFn: fetchRaces,
    staleTime: 60 * 1000,
  })

const stopwords = ['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'the']

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const buildSlugCandidates = (value: string) => {
  const main = slugify(value)
  const candidates = new Set<string>([main])
  const parts = main.split('-').filter(Boolean)
  if (parts.length > 1 && stopwords.includes(parts[0])) {
    candidates.add(parts.slice(1).join('-'))
  }
  return Array.from(candidates)
}

const fetchRaceByIdentifier = async (identifier: string): Promise<RaceListItem> => {
  const allRaces = await fetchRaces()
  const needle = identifier.toLowerCase()

  const race = allRaces.find((item) => {
    if (!item) return false
    if (item.id === identifier) return true
    const candidates = [
      ...(item.slug ? [item.slug.toLowerCase()] : []),
      ...buildSlugCandidates(item.name),
    ]
    return candidates.some((candidate) => candidate === needle)
  })

  if (!race) {
    throw new Error('Course introuvable')
  }

  return race
}

export const useRaceById = (id: string) =>
  useQuery<RaceListItem, Error>({
    queryKey: ['races', id],
    queryFn: () => fetchRaceByIdentifier(id),
    staleTime: 60 * 1000,
  })
export const raceKey = (id: string) => ['races', id] as const
