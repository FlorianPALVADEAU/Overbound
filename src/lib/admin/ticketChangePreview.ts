import { isOpenFormatTicket, isRankedFormatTicket } from '@/lib/openSas'
import { createHash } from 'node:crypto'

const PREVIEW_TTL_SECONDS = 300

export type TicketFormat = 'OPEN' | 'RANKED' | 'UNKNOWN'

export type TicketPreviewInput = {
  currentTicket: { id: string; eventId: string; name: string; raceName?: string | null; priceCents?: number | null; currency?: string | null }
  targetTicket: { id: string; eventId: string; name: string; raceName?: string | null; priceCents?: number | null; currency?: string | null }
  registration: { eventId: string; waveIndex?: number | null; startTime?: string | null; userId?: string | null }
  group?: { name: string; anchorEventId?: string | null; anchorWaveIndex?: number | null; anchorStartTime?: string | null } | null
  targetWave?: { waveIndex: number; startTime: string; capacity: number; assignedCount: number } | null
}

export type TicketChangePreview = {
  previewId: string
  expiresAt: string
  sourceVersion: string
  allowed: boolean
  current: { ticketId: string; name: string; format: TicketFormat; waveIndex: number | null; startTime: string | null }
  target: { ticketId: string; name: string; format: TicketFormat; waveIndex: number | null; startTime: string | null }
  impacts: {
    format: 'unchanged' | 'changed'
    sas: 'unchanged' | 'cleared' | 'requires_assignment' | 'assigned' | 'not_applicable' | 'unknown'
    group: 'none' | 'preserved' | 'anchor_applies' | 'not_applicable'
    financial: { status: 'no_change' | 'potential_change' | 'unknown'; currentPriceCents: number | null; targetPriceCents: number | null; currency: string | null }
  }
  warnings: string[]
  blockers: string[]
}

export function getTicketFormat(name?: string | null, raceName?: string | null): TicketFormat {
  if (isOpenFormatTicket(name, raceName)) return 'OPEN'
  if (isRankedFormatTicket(name, raceName)) return 'RANKED'
  return 'UNKNOWN'
}

export function buildTicketChangePreview(input: TicketPreviewInput): TicketChangePreview {
  const currentFormat = getTicketFormat(input.currentTicket.name, input.currentTicket.raceName)
  const targetFormat = getTicketFormat(input.targetTicket.name, input.targetTicket.raceName)
  const warnings: string[] = []
  const blockers: string[] = []
  const currentWave = input.registration.waveIndex ?? null
  const currentStart = input.registration.startTime ?? null
  const sameTicket = input.currentTicket.id === input.targetTicket.id
  const sameEvent = input.registration.eventId === input.currentTicket.eventId && input.registration.eventId === input.targetTicket.eventId

  if (!sameEvent) blockers.push('Le billet actuel et le billet cible doivent appartenir au même événement.')
  if (sameTicket) blockers.push('Le billet cible est déjà attribué à cette inscription.')
  if (currentFormat === 'UNKNOWN' || targetFormat === 'UNKNOWN') blockers.push('Le format OPEN/RANKED ne peut pas être déterminé de façon fiable.')

  let targetWave: number | null = null
  let targetStart: string | null = null
  let sas: TicketChangePreview['impacts']['sas'] = 'unknown'
  let groupImpact: TicketChangePreview['impacts']['group'] = 'none'

  if (targetFormat === 'RANKED') {
    sas = currentFormat === 'OPEN' && currentWave !== null ? 'cleared' : 'not_applicable'
    if (currentFormat === 'OPEN' && input.group?.anchorEventId === input.registration.eventId) {
      warnings.push('Le passage en RANKED retire la SAS OPEN ; l’ancre du groupe ne s’applique pas au format RANKED.')
      groupImpact = 'not_applicable'
    }
  } else if (targetFormat === 'OPEN') {
    const group = input.group
    const anchorApplies = group?.anchorEventId === input.registration.eventId && group.anchorWaveIndex != null
    if (anchorApplies) {
      targetWave = group.anchorWaveIndex ?? null
      targetStart = group.anchorStartTime ?? null
      sas = 'assigned'
      groupImpact = 'anchor_applies'
      warnings.push(`L’ancre du groupe « ${group.name} » impose la SAS ${targetWave}.`)
    } else if (input.targetWave) {
      targetWave = input.targetWave.waveIndex
      targetStart = input.targetWave.startTime
      sas = input.targetWave.assignedCount >= input.targetWave.capacity ? 'requires_assignment' : 'assigned'
      if (sas === 'requires_assignment') blockers.push('La SAS cible est pleine ; une nouvelle attribution OPEN doit être calculée au moment de la confirmation.')
    } else {
      sas = 'requires_assignment'
      warnings.push('La SAS OPEN sera calculée au moment de la confirmation selon les règles d’assignation.')
    }
    if (input.group?.anchorEventId !== input.registration.eventId) groupImpact = input.group ? 'not_applicable' : 'none'
  } else {
    sas = 'unknown'
  }

  const pricesKnown = input.currentTicket.priceCents != null && input.targetTicket.priceCents != null
  const pricesEqual = pricesKnown && input.currentTicket.priceCents === input.targetTicket.priceCents && input.currentTicket.currency === input.targetTicket.currency
  const financialStatus = pricesEqual ? 'no_change' : pricesKnown ? 'potential_change' : 'unknown'
  if (financialStatus !== 'no_change') {
    const reason = financialStatus === 'unknown' ? 'non calculable' : 'différent'
    blockers.push(`Impact financier ${reason} : la politique financière doit être validée avant toute mutation.`)
  }

  const sourceDigest = createHash('sha256').update(JSON.stringify({
    currentTicket: input.currentTicket,
    targetTicket: input.targetTicket,
    registration: input.registration,
    group: input.group ?? null,
    targetWave: input.targetWave ?? null,
  })).digest('hex')
  const sourceVersion = sourceDigest.slice(0, 16)
  const previewId = `${sourceDigest.slice(0, 8)}-${sourceDigest.slice(8, 12)}-5${sourceDigest.slice(13, 16)}-8${sourceDigest.slice(17, 20)}-${sourceDigest.slice(20, 32)}`
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_SECONDS * 1000).toISOString()

  return {
    previewId,
    expiresAt,
    sourceVersion,
    allowed: blockers.length === 0,
    current: { ticketId: input.currentTicket.id, name: input.currentTicket.name, format: currentFormat, waveIndex: currentWave, startTime: currentStart },
    target: { ticketId: input.targetTicket.id, name: input.targetTicket.name, format: targetFormat, waveIndex: targetWave, startTime: targetStart },
    impacts: {
      format: currentFormat === targetFormat ? 'unchanged' : 'changed',
      sas,
      group: groupImpact,
      financial: { status: financialStatus, currentPriceCents: input.currentTicket.priceCents ?? null, targetPriceCents: input.targetTicket.priceCents ?? null, currency: input.targetTicket.currency ?? input.currentTicket.currency ?? null },
    },
    warnings,
    blockers,
  }
}
