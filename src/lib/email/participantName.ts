/**
 * First word of a participant name for a greeting. Some callers pass the email address when no name
 * is known: greeting someone with "Salut alex@mail.com" reads badly, so that case gives null.
 */
export function getFirstName(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  if (!trimmed || trimmed.includes('@')) return null
  return trimmed.split(/\s+/)[0]
}
