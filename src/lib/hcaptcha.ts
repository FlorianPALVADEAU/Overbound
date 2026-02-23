const VERIFY_URL = 'https://hcaptcha.com/siteverify'

type HCaptchaVerifyResponse = {
  success?: boolean
  'error-codes'?: string[]
  score?: number
}

export async function verifyHCaptcha(token: string | null | undefined, remoteIp?: string | null) {
  const secret = process.env.HCAPTCHA_SECRET_KEY

  if (!secret) {
    // Allow in local/dev when secret is not configured.
    return true
  }

  if (!token) {
    return false
  }

  const params = new URLSearchParams()
  params.set('secret', secret)
  params.set('response', token)
  if (remoteIp) {
    params.set('remoteip', remoteIp)
  }

  const response = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    return false
  }

  const payload = (await response.json().catch(() => null)) as HCaptchaVerifyResponse | null
  return Boolean(payload?.success)
}
