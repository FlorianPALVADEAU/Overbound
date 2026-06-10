const TEMP_AMBASSADOR_EMAIL_ALLOWLIST = ['florian.plvd@gmail.com']

export const hasAmbassadorAccess = (options: {
  role?: string | null
  email?: string | null
}) => {
  if (options.role === 'ambassador') {
    return true
  }

  if (!options.email) {
    return false
  }

  const normalized = options.email.trim().toLowerCase()
  return TEMP_AMBASSADOR_EMAIL_ALLOWLIST.includes(normalized)
}
