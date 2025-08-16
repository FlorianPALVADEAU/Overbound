export function getBaseUrl(req: Request) {
  const h = req.headers;
  const fromHeader = h.get('origin') || h.get('x-forwarded-proto') && h.get('x-forwarded-host')
    ? `${h.get('x-forwarded-proto')}://${h.get('x-forwarded-host')}`
    : null;
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.NEXT_BASE_URL;

  const origin = fromHeader || envUrl || 'http://localhost:3000';
  if (!/^https?:\/\//i.test(origin)) throw new Error('Base URL must include http(s)://');
  return origin.replace(/\/+$/, '');
}
