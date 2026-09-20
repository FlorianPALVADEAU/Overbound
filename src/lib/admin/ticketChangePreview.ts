import { createHash } from 'node:crypto'
import { resolveTicketOperationsProfile, type TicketOperationsProfile } from '@/lib/tickets/operationsProfile'

const PREVIEW_TTL_SECONDS = 300

export type TicketPreviewInput = {
  currentTicket: { id: string; eventId: string; name: string; priceCents?: number | null; currency?: string | null; operationsConfig?: Record<string, unknown> | null }
  targetTicket: { id: string; eventId: string; name: string; priceCents?: number | null; currency?: string | null; operationsConfig?: Record<string, unknown> | null }
  registration: { eventId: string; waveIndex?: number | null; startTime?: string | null; userId?: string | null }
  group?: { name: string; anchorEventId?: string | null; anchorWaveIndex?: number | null; anchorStartTime?: string | null } | null
  targetWave?: { waveIndex: number; startTime: string; capacity: number; assignedCount: number } | null
}

export type TicketChangePreview = {
  previewId: string
  expiresAt: string
  sourceVersion: string
  allowed: boolean
  current: { ticketId: string; name: string; operations: TicketOperationsProfile; waveIndex: number | null; startTime: string | null }
  target: { ticketId: string; name: string; operations: TicketOperationsProfile; waveIndex: number | null; startTime: string | null }
  impacts: {
    departure: 'unchanged' | 'cleared' | 'requires_assignment' | 'assigned' | 'not_applicable' | 'unknown'
    group: 'none' | 'preserved' | 'anchor_applies' | 'not_applicable'
    financial: { status: 'no_change' | 'potential_change' | 'unknown'; currentPriceCents: number | null; targetPriceCents: number | null; currency: string | null }
  }
  warnings: string[]
  blockers: string[]
}

export function buildTicketChangePreview(input: TicketPreviewInput): TicketChangePreview {
  const currentOperations = resolveTicketOperationsProfile(input.currentTicket.operationsConfig)
  const targetOperations = resolveTicketOperationsProfile(input.targetTicket.operationsConfig)
  const warnings: string[] = []
  const blockers: string[] = []
  const currentWave = input.registration.waveIndex ?? null
  const currentStart = input.registration.startTime ?? null
  const sameTicket = input.currentTicket.id === input.targetTicket.id
  const sameEvent = input.registration.eventId === input.currentTicket.eventId && input.registration.eventId === input.targetTicket.eventId

  if (!sameEvent) blockers.push('Le billet actuel et le billet cible doivent appartenir au même événement.')
  if (sameTicket) blockers.push('Le billet cible est déjà attribué à cette inscription.')
  if (targetOperations.status === 'unconfigured') {
    blockers.push('Les règles opérationnelles du billet cible doivent être configurées avant toute modification.')
  }

  let targetWave: number | null = null
  let targetStart: string | null = null
  let departure: TicketChangePreview['impacts']['departure'] = 'unknown'
  let groupImpact: TicketChangePreview['impacts']['group'] = 'none'
  const targetDepartureMode = targetOperations.departureMode

  if (targetOperations.departureChangePolicy === 'preserve') {
    departure = currentWave !== null || currentStart !== null ? 'unchanged' : 'not_applicable'
    groupImpact = input.group ? 'preserved' : 'none'
  } else if (targetDepartureMode === 'none' || targetOperations.departureChangePolicy === 'clear') {
    departure = currentWave !== null || currentStart !== null ? 'cleared' : 'not_applicable'
    groupImpact = input.group ? 'not_applicable' : 'none'
  } else if (targetDepartureMode === 'fixed') {
    departure = 'requires_assignment'
    warnings.push('Le départ fixe configuré sur le billet sera appliqué lors de la confirmation.')
    groupImpact = input.group ? 'not_applicable' : 'none'
  } else if (targetDepartureMode === 'wave') {
    const group = input.group
    const anchorApplies = group?.anchorEventId === input.registration.eventId && group.anchorWaveIndex != null
    if (anchorApplies) {
      targetWave = group.anchorWaveIndex ?? null
      targetStart = group.anchorStartTime ?? null
      departure = 'assigned'
      groupImpact = 'anchor_applies'
      warnings.push(`L’ancre du groupe « ${group.name} » impose la SAS ${targetWave}.`)
    } else if (input.targetWave) {
      targetWave = input.targetWave.waveIndex
      targetStart = input.targetWave.startTime
      departure = input.targetWave.assignedCount >= input.targetWave.capacity ? 'requires_assignment' : 'assigned'
      if (departure === 'requires_assignment') blockers.push('La SAS cible est pleine ; une nouvelle attribution doit être calculée au moment de la confirmation.')
    } else {
      departure = 'requires_assignment'
      warnings.push('Le départ par SAS sera calculé au moment de la confirmation selon les règles d’assignation.')
    }
    if (input.group?.anchorEventId !== input.registration.eventId) groupImpact = input.group ? 'not_applicable' : 'none'
  }

  const pricesKnown = input.currentTicket.priceCents != null && input.targetTicket.priceCents != null
  const pricesEqual = pricesKnown && input.currentTicket.priceCents === input.targetTicket.priceCents && input.currentTicket.currency === input.targetTicket.currency
  const financialStatus = pricesEqual ? 'no_change' : pricesKnown ? 'potential_change' : 'unknown'
  if (financialStatus !== 'no_change') {
    warnings.push(
      financialStatus === 'unknown'
        ? 'L’écart financier ne peut pas être calculé. Le prix historique restera inchangé et aucune opération financière ne sera créée.'
        : 'Le prix du billet cible est différent. Le prix historique restera inchangé et aucune opération financière ne sera créée.',
    )
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
    current: { ticketId: input.currentTicket.id, name: input.currentTicket.name, operations: currentOperations, waveIndex: currentWave, startTime: currentStart },
    target: { ticketId: input.targetTicket.id, name: input.targetTicket.name, operations: targetOperations, waveIndex: targetWave, startTime: targetStart },
    impacts: {
      departure,
      group: groupImpact,
      financial: { status: financialStatus, currentPriceCents: input.currentTicket.priceCents ?? null, targetPriceCents: input.targetTicket.priceCents ?? null, currency: input.targetTicket.currency ?? input.currentTicket.currency ?? null },
    },
    warnings,
    blockers,
  }
}
