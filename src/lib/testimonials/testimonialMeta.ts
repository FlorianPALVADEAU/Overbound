interface TestimonialIdentity {
  age?: number
  location?: string
}

/** "22 ans • Jouars", with whichever parts exist. Empty when neither is known. */
export function testimonialMeta({ age, location }: TestimonialIdentity): string {
  return [age ? `${age} ans` : null, location].filter(Boolean).join(' • ')
}
