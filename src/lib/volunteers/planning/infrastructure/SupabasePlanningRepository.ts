import { supabaseAdmin } from '@/lib/supabase/server'
import type { PodCatalog } from '../../shared/Pod'
import { isShift } from '../../shared/Shift'
import type { PlanningRepository } from '../application/ports'
import { Assignment, isAssignmentRole } from '../domain/Assignment'
import { VolunteerCandidate, type ApplicationRecord } from '../domain/VolunteerCandidate'
import type { ZoneSetting } from '../domain/ZoneSetting'

interface ApplicationRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  availability: string
  preferred_mission: string
  event_id: string | null
  event_snapshot: { id?: string | null } | null
}

interface AssignmentRow {
  id: string
  application_id: string | null
  display_name: string
  shift: string
  zone_key: string
  role: string
  locked: boolean
}

interface SettingRow {
  shift: string
  zone_key: string
  capacity: number | null
  weight: number | null
}

const toRecord = (row: ApplicationRow): ApplicationRecord => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  availability: row.availability,
  mission: row.preferred_mission,
  eventId: row.event_id,
  eventSnapshotId: row.event_snapshot?.id ?? null,
})

const toRow = (eventId: string, assignment: Assignment) => ({
  event_id: eventId,
  application_id: assignment.applicationId,
  display_name: assignment.displayName,
  shift: assignment.shift,
  zone_key: assignment.zoneKey,
  role: assignment.role,
  locked: assignment.locked,
})

export class SupabasePlanningRepository implements PlanningRepository {
  constructor(private readonly pods: PodCatalog) {}

  private get db() {
    return supabaseAdmin()
  }

  async findCandidates(eventId: string): Promise<VolunteerCandidate[]> {
    const { data, error } = await this.db
      .from('volunteer_applications')
      .select('id, full_name, email, phone, availability, preferred_mission, event_id, event_snapshot')
      .or(`event_id.eq.${eventId},event_snapshot->>id.eq.${eventId},event_id.is.null`)
      .order('submitted_at', { ascending: true })
    if (error) throw error

    return ((data ?? []) as ApplicationRow[]).map((row) => VolunteerCandidate.fromRecord(toRecord(row), this.pods))
  }

  async findAssignments(eventId: string): Promise<Assignment[]> {
    const { data, error } = await this.db
      .from('volunteer_assignments')
      .select('id, application_id, display_name, shift, zone_key, role, locked')
      .eq('event_id', eventId)
    if (error) throw error

    return ((data ?? []) as AssignmentRow[]).flatMap((row) =>
      isShift(row.shift) && isAssignmentRole(row.role)
        ? [
            new Assignment({
              id: row.id,
              applicationId: row.application_id,
              displayName: row.display_name,
              shift: row.shift,
              zoneKey: row.zone_key,
              role: row.role,
              locked: row.locked,
            }),
          ]
        : [],
    )
  }

  async findZoneSettings(eventId: string): Promise<ZoneSetting[]> {
    const { data, error } = await this.db
      .from('volunteer_zone_settings')
      .select('shift, zone_key, capacity, weight')
      .eq('event_id', eventId)
    if (error) throw error

    return ((data ?? []) as SettingRow[]).flatMap((row) =>
      isShift(row.shift)
        ? [{ shift: row.shift, zoneKey: row.zone_key, capacity: row.capacity, weight: row.weight }]
        : [],
    )
  }

  async findEventDate(eventId: string): Promise<string | null> {
    const { data, error } = await this.db.from('events').select('date').eq('id', eventId).maybeSingle()
    if (error) throw error
    return data?.date ?? null
  }

  async addAssignments(eventId: string, assignments: readonly Assignment[]): Promise<void> {
    const { error } = await this.db.from('volunteer_assignments').insert(assignments.map((a) => toRow(eventId, a)))
    if (error) throw error
  }

  async deleteAssignments(eventId: string, ids: readonly string[]): Promise<void> {
    const { error } = await this.db.from('volunteer_assignments').delete().eq('event_id', eventId).in('id', [...ids])
    if (error) throw error
  }

  async saveAssignment(eventId: string, assignment: Assignment): Promise<void> {
    const row = { ...toRow(eventId, assignment), updated_at: new Date().toISOString() }

    if (assignment.id) {
      const { error } = await this.db.from('volunteer_assignments').update(row).eq('event_id', eventId).eq('id', assignment.id)
      if (error) throw error
      return
    }

    const existing = assignment.applicationId
      ? await this.db
          .from('volunteer_assignments')
          .select('id')
          .eq('event_id', eventId)
          .eq('application_id', assignment.applicationId)
          .eq('shift', assignment.shift)
          .maybeSingle()
      : null
    if (existing?.error) throw existing.error

    const { error } = existing?.data
      ? await this.db.from('volunteer_assignments').update(row).eq('id', existing.data.id)
      : await this.db.from('volunteer_assignments').insert(row)
    if (error) throw error
  }

  async saveZoneSetting(eventId: string, setting: ZoneSetting): Promise<void> {
    const { error } = await this.db.from('volunteer_zone_settings').upsert(
      {
        event_id: eventId,
        shift: setting.shift,
        zone_key: setting.zoneKey,
        capacity: setting.capacity,
        weight: setting.weight,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,shift,zone_key' },
    )
    if (error) throw error
  }
}
