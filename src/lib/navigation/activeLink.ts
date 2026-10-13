/**
 * True when a navigation link points to the page being viewed, or to one of
 * its parents (`/blog` is active on `/blog/post/x`). The home link only
 * matches the home page. Hashes and query strings in `href` are ignored.
 */
export const isActiveNavHref = (pathname: string | null, href: string): boolean => {
  if (!pathname || !href.startsWith('/')) return false
  const target = href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
  const current = pathname.replace(/\/$/, '') || '/'
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}
