import { z } from 'zod'

export const TEAM_SIZES = [
  { value: '2-5', label: '2 à 5' },
  { value: '6-9', label: '6 à 9' },
  { value: '10-19', label: '10 à 19' },
  { value: '20-49', label: '20 à 49' },
  { value: '50+', label: '50 et plus' },
] as const

export const PROJECT_TYPES = [
  { value: 'tickets', label: 'Billets pour une équipe' },
  { value: 'tickets-options', label: 'Billets et options (T-shirts, photos)' },
  { value: 'custom', label: 'Événement sur mesure' },
  { value: 'partnership', label: 'Partenariat' },
] as const

/** Pipeline of a request, in the order the founder works it. */
export const QUOTE_STATUSES = [
  { value: 'new', label: 'Nouvelle' },
  { value: 'contacted', label: 'Contactée' },
  { value: 'quoted', label: 'Devis envoyé' },
  { value: 'won', label: 'Gagnée' },
  { value: 'lost', label: 'Perdue' },
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]['value']

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

// A single line: these values end up in an email subject and a spreadsheet.
const singleLine = (min: number, max: number) =>
  z.string().trim().min(min).max(max).regex(/^[^\r\n]*$/, 'Une seule ligne')

export const quoteRequestSchema = z.object({
  companyName: singleLine(2, 120),
  fullName: singleLine(2, 120),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  phone: singleLine(0, 30).optional(),
  teamSize: z.enum(TEAM_SIZES.map((size) => size.value) as [string, ...string[]]),
  projectType: z.enum(PROJECT_TYPES.map((type) => type.value) as [string, ...string[]]),
  message: z.string().trim().max(2000).optional(),
  utm: z.partialRecord(z.enum(UTM_KEYS), z.string().max(200)).optional(),
  /** Honeypot: a person never fills it, a bot does. */
  website: z.string().optional(),
  /** Cloudflare Turnstile token; checked in the route, never stored. */
  turnstileToken: z.string().max(2048).optional(),
})

export type QuoteRequest = z.infer<typeof quoteRequestSchema>

export const isHoneypotTriggered = (request: Pick<QuoteRequest, 'website'>) => Boolean(request.website?.trim())

/** Empty optional fields become null so the table never stores empty strings. */
export const toQuoteRow = (request: QuoteRequest) => ({
  company_name: request.companyName,
  full_name: request.fullName,
  email: request.email,
  phone: request.phone || null,
  team_size: request.teamSize,
  project_type: request.projectType,
  message: request.message || null,
  utm: request.utm && Object.keys(request.utm).length > 0 ? request.utm : null,
})

export const labelOf = (options: ReadonlyArray<{ value: string; label: string }>, value: string) =>
  options.find((option) => option.value === value)?.label ?? value
