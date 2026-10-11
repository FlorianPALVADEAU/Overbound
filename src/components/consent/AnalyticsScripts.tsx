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

  return (
    <>
      {analyticsConsent && GA_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {analyticsConsent && GTM_CONTAINER_ID && (
        <Script id="gtm-base" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
          `}
        </Script>
      )}

      {marketingConsent && META_PIXEL_ID && (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        </>
      )}
    </>
  )
}
