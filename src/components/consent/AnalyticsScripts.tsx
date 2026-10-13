'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import * as Sentry from '@sentry/nextjs'
import { CONSENT_EVENT, readConsent } from './consent'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function AnalyticsScripts() {
  const [analyticsConsent, setAnalyticsConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  useEffect(() => {
    const updateConsent = () => {
      const consent = readConsent()
      setAnalyticsConsent(consent?.analytics === true)
      setMarketingConsent(consent?.marketing === true)
    }

    updateConsent()
    window.addEventListener(CONSENT_EVENT, updateConsent)

    return () => window.removeEventListener(CONSENT_EVENT, updateConsent)
  }, [])

  // Session replay records what people type and click: it only starts once audience measurement is accepted,
  // with every text and media masked. Error monitoring itself runs without it (see instrumentation-client.ts).
  useEffect(() => {
    if (!analyticsConsent) return
    Sentry.addIntegration(Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }))
  }, [analyticsConsent])

  // Each tracker is split in two. The inline bootstrap (dataLayer, gtag, fbq stub) runs right after
  // hydration: it is tiny and queues every event, so nothing tracked during the first seconds is
  // lost. The external library (the heavy download) loads with lazyOnload, once the browser is
  // idle after the page has loaded, and then replays the queue. Keeps them off the critical path.
  return (
    <>
      {analyticsConsent && GA_MEASUREMENT_ID && (
        <>
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
        </>
      )}

      {analyticsConsent && GTM_CONTAINER_ID && (
        <>
          <Script id="gtm-base" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            `}
          </Script>
          <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`} />
        </>
      )}

      {marketingConsent && META_PIXEL_ID && (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`
              !function(f,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[]}(window);
              fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
          <Script strategy="lazyOnload" src="https://connect.facebook.net/en_US/fbevents.js" />
        </>
      )}
    </>
  )
}
