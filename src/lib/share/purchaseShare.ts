export const SHARE_UTM = 'utm_source=share&utm_medium=social&utm_campaign=purchase_share'

export const getFirstName = (fullName: string | null | undefined): string | null => {
  const first = fullName?.trim().split(/\s+/)[0]
  return first ? first : null
}

export const buildShareUrl = (origin: string, eventSlug: string): string =>
  `${origin.replace(/\/+$/, '')}/events/${encodeURIComponent(eventSlug)}?${SHARE_UTM}`

export const buildShareText = (eventTitle: string): string =>
  `Je suis inscrit·e à ${eventTitle} ! Rejoins-moi sur la ligne de départ`

export type SocialNetwork = 'whatsapp' | 'x' | 'reddit' | 'facebook'

export const buildSocialShareLinks = (
  shareUrl: string,
  text: string,
): Record<SocialNetwork, string> => {
  const url = encodeURIComponent(shareUrl)
  const message = encodeURIComponent(text)
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
    x: `https://twitter.com/intent/tweet?text=${message}&url=${url}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${message}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  }
}
