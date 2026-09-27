// FDR-0014 §13: wheel_impression, wheel_opened, email_submitted, wheel_spun,
// reward_won, reward_cta_clicked, checkout_started, reward_redeemed,
// ticket_purchased. Mirrors the dataLayer/gtag push pattern already used by
// useEventAnalytics (src/hooks/events/useEventAnalytics.ts) rather than
// introducing a second analytics mechanism. Never includes raw email or
// other PII in the payload (spec §13).

export type LuckyWheelAnalyticsEvent =
  | 'wheel_impression'
  | 'wheel_opened'
  | 'email_submitted'
  | 'wheel_spun'
  | 'reward_won'
  | 'reward_cta_clicked'
  | 'checkout_started'
  | 'reward_redeemed'
  | 'ticket_purchased'

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export const trackLuckyWheelEvent = (
  eventName: LuckyWheelAnalyticsEvent,
  payload: AnalyticsPayload = {},
) => {
  if (typeof window === 'undefined') return

  const analyticsWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>
  }

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
  analyticsWindow.dataLayer.push({
    event: `lucky_wheel_${eventName}`,
    ...payload,
  })
}
