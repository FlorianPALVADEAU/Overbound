export type SelectedWaveAssignment = {
  waveIndex: number
  startTime: string
  waveCapacity: number
  wavePosition: number
}

export class SelectedWaveUnavailableError extends Error {
  constructor(eventId: string, waveIndex: number) {
    super(`SELECTED_WAVE_UNAVAILABLE: SAS ${waveIndex} indisponible pour l'événement ${eventId}`)
    this.name = 'SelectedWaveUnavailableError'
  }
}

const isSelectedWaveUnavailable = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('SELECTED_WAVE_UNAVAILABLE')
}

const toAssignment = (row: any): SelectedWaveAssignment => ({
  waveIndex: row.wave_index,
  startTime: row.start_time,
  waveCapacity: row.wave_capacity,
  wavePosition: row.wave_position,
})

/**
 * Assigns a participant-chosen SAS OPEN, revalidated and locked atomically
 * server-side (assign_selected_wave_to_registration — FOR UPDATE on the
 * event_waves row, no read-then-write from application code). Throws
 * SelectedWaveUnavailableError if the wave filled up, closed, or vanished
 * between the participant's choice and payment confirmation (FDR-0012 §3.2).
 */
export const assignSelectedWaveToRegistration = async ({
  admin,
  eventId,
  registrationId,
  waveIndex,
}: {
  admin: any
  eventId: string
  registrationId: string
  waveIndex: number
}): Promise<SelectedWaveAssignment> => {
  const { data, error } = await admin.rpc('assign_selected_wave_to_registration', {
    p_event_id: eventId,
    p_registration_id: registrationId,
    p_wave_index: waveIndex,
  })

  if (error) {
    if (isSelectedWaveUnavailable(error)) {
      throw new SelectedWaveUnavailableError(eventId, waveIndex)
    }
    throw error
  }

  return toAssignment(data)
}

/**
 * Syncs a registration onto its group's already-committed anchor wave.
 * Same atomic locking as assignSelectedWaveToRegistration, but never
 * rejects on is_closed — an anchor already committed to a wave stays
 * honorable even if that wave was later closed to new selections
 * (FDR-0009 §1.2 hardening, FDR-0012 §4).
 */
export const syncRegistrationToGroupAnchor = async ({
  admin,
  eventId,
  registrationId,
  waveIndex,
}: {
  admin: any
  eventId: string
  registrationId: string
  waveIndex: number
}): Promise<SelectedWaveAssignment> => {
  const { data, error } = await admin.rpc('sync_registration_to_group_anchor', {
    p_event_id: eventId,
    p_registration_id: registrationId,
    p_wave_index: waveIndex,
  })

  if (error) {
    throw error
  }

  return toAssignment(data)
}
