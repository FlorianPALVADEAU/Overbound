/** Keeps enough of the address to show where consent came from without identifying a household: drops the last IPv4 octet, keeps the IPv6 /48. */
export const anonymizeIp = (ip: string | null): string | null => {
  if (!ip) return null
  if (ip.includes(':')) return `${ip.split(':').slice(0, 3).join(':')}::`
  const octets = ip.split('.')
  return octets.length === 4 ? `${octets.slice(0, 3).join('.')}.0` : null
}
