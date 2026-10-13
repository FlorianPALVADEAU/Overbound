/**
 * Which image URLs next/image may optimize. Shared with next.config.ts so the
 * optimizer allowlist and the components that rely on it never drift apart.
 */
export const REMOTE_IMAGE_PATTERNS = [
  { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
  { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' },
  { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
] as const

/** Quality for photos shown behind a dark overlay; listed in next.config.ts `images.qualities`. */
export const BACKGROUND_IMAGE_QUALITY = 50

/** Every quality a component may request; next/image refuses the others. */
export const IMAGE_QUALITIES = [BACKGROUND_IMAGE_QUALITY, 75]

/**
 * Vercel's image optimizer returns AVIF sources untouched (no resize), so every
 * AVIF under public/images has a WebP twin that it does resize. Database rows
 * still store .avif URLs: they are served through that twin.
 */
const toResizableTwin = (path: string) =>
  path.startsWith('/images/') && path.endsWith('.avif') ? `${path.slice(0, -5)}.webp` : path

/** Hosts serving our own public/ folder: their URLs are rewritten to local paths. */
const OWN_HOSTS = new Set(['overbound-race.com', 'www.overbound-race.com'])

const matchesHost = (pattern: string, hostname: string) =>
  pattern.startsWith('*.') ? hostname.endsWith(pattern.slice(1)) : hostname === pattern

const matchesPath = (pattern: string, pathname: string) =>
  pattern.endsWith('/**') ? pathname.startsWith(pattern.slice(0, -2)) : pathname === pattern

export interface ImageSource {
  src: string
  /** False when the host is outside the allowlist: next/image must then serve it as is. */
  optimizable: boolean
}

/**
 * Normalizes an image URL coming from the database or the CMS for next/image.
 * Absolute URLs on our own domain become local paths (served from public/),
 * allowlisted remote hosts stay optimizable, anything else is passed through.
 */
export function resolveImageSource(url: string): ImageSource {
  if (url.startsWith('/') && !url.startsWith('//')) return { src: toResizableTwin(url), optimizable: true }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { src: url, optimizable: false }
  }

  if (OWN_HOSTS.has(parsed.hostname)) {
    return { src: `${toResizableTwin(parsed.pathname)}${parsed.search}`, optimizable: true }
  }

  const optimizable = REMOTE_IMAGE_PATTERNS.some(
    (pattern) =>
      parsed.protocol === `${pattern.protocol}:` &&
      matchesHost(pattern.hostname, parsed.hostname) &&
      matchesPath(pattern.pathname, parsed.pathname),
  )
  return { src: url, optimizable }
}
