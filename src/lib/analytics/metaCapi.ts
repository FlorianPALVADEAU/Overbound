import crypto from 'crypto';

type MetaCustomData = Record<string, string | number | boolean | string[] | undefined>

interface MetaUserDataInput {
  email?: string | null
  externalId?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
}

interface SendMetaCapiEventInput {
  eventName:
    | 'ViewContent'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'Purchase'
    | 'CompleteRegistration'
    | 'payment_confirmed'
    | string
  eventId?: string
  eventSourceUrl?: string
  actionSource?: 'website'
  userData?: MetaUserDataInput
  customData?: MetaCustomData
}

const META_DATASET_ID =
  process.env.META_CAPI_DATASET_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
const META_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || ''
const META_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || ''

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

const toUnixSeconds = () => Math.floor(Date.now() / 1000)

export const buildMetaUserData = (userData?: MetaUserDataInput) => {
  if (!userData) return undefined

  const payload: Record<string, string | string[]> = {}
  if (userData.email) payload.em = [sha256(normalizeEmail(userData.email))]
  if (userData.externalId) payload.external_id = [sha256(String(userData.externalId).trim())]
  if (userData.clientIpAddress) payload.client_ip_address = userData.clientIpAddress
  if (userData.clientUserAgent) payload.client_user_agent = userData.clientUserAgent
  if (userData.fbp) payload.fbp = userData.fbp
  if (userData.fbc) payload.fbc = userData.fbc

  return Object.keys(payload).length > 0 ? payload : undefined
}

export const sendMetaCapiEvent = async (input: SendMetaCapiEventInput) => {
  if (!META_DATASET_ID || !META_ACCESS_TOKEN) return

  const userData = buildMetaUserData(input.userData)

  const eventPayload: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: toUnixSeconds(),
    action_source: input.actionSource ?? 'website',
  }

  if (input.eventId) eventPayload.event_id = input.eventId
  if (input.eventSourceUrl) eventPayload.event_source_url = input.eventSourceUrl
  if (userData) eventPayload.user_data = userData
  if (input.customData && Object.keys(input.customData).length > 0) {
    eventPayload.custom_data = input.customData
  }

  const body: Record<string, unknown> = {
    data: [eventPayload],
  }
  if (META_TEST_EVENT_CODE) body.test_event_code = META_TEST_EVENT_CODE

  const endpoint = `https://graph.facebook.com/v21.0/${META_DATASET_ID}/events?access_token=${encodeURIComponent(
    META_ACCESS_TOKEN,
  )}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      console.error('[meta-capi] non-200 response', response.status, details)
    }
  } catch (error) {
    console.error('[meta-capi] request error', error)
  }
}
