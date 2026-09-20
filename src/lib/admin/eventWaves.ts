import { buildOpenWaveRows, getOpenWaveProvisioningState } from '@/lib/openSas'

/**
 * Admin-facing event wave contract.
 *
 * Every ticket whose explicit operations profile uses
 * `departure_mode: "wave"` owns an independent wave inventory. The legacy
 * builder name remains an internal compatibility detail only.
 */
export const buildDefaultEventWaveRows = buildOpenWaveRows
export const getEventWaveProvisioningState = getOpenWaveProvisioningState
