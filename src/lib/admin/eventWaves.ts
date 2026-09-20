import { buildOpenWaveRows, getOpenWaveProvisioningState } from '@/lib/openSas'

/**
 * Admin-facing event wave contract.
 *
 * Event waves are shared by every ticket whose explicit operations profile
 * uses `departure_mode: "wave"`. The legacy OPEN implementation remains an
 * internal compatibility detail while checkout assignment is migrated.
 */
export const buildDefaultEventWaveRows = buildOpenWaveRows
export const getEventWaveProvisioningState = getOpenWaveProvisioningState
