const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizePopupSubscribeValue(value: string) {
  return value.trim()
}

export function isValidPopupSubscribeEmail(value: string) {
  return EMAIL_REGEX.test(normalizePopupSubscribeValue(value))
}

export function getPopupSubscribeValidationError(input: { fullName: string; email: string }) {
  const fullName = normalizePopupSubscribeValue(input.fullName)
  const email = normalizePopupSubscribeValue(input.email)

  if (!fullName) {
    return 'Le prénom est requis.'
  }

  if (!email) {
    return "L'adresse email est requise."
  }

  if (!isValidPopupSubscribeEmail(email)) {
    return 'Adresse email invalide.'
  }

  return null
}
