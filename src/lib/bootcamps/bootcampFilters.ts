import type { Bootcamp } from '@/types/Bootcamp'

export function filterUpcoming(bootcamps: Bootcamp[], now = new Date()): Bootcamp[] {
  return bootcamps
    .filter((b) => new Date(b.starts_at) >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}

export function filterPast(bootcamps: Bootcamp[], now = new Date()): Bootcamp[] {
  return bootcamps
    .filter((b) => new Date(b.starts_at) < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
}

export function buildRegistrationCount(
  bootcamps: Array<{ bootcamp_registrations: Array<{ count: number }> }>,
): number[] {
  return bootcamps.map((b) => b.bootcamp_registrations[0]?.count ?? 0)
}
