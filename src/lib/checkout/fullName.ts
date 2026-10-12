/** Splits an account's full name for the first bib: first word as first name, the rest as last name. */
export const splitFullName = (fullName: string | null | undefined): { firstName: string; lastName: string } => {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  return { firstName: words[0] ?? '', lastName: words.slice(1).join(' ') }
}
