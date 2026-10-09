import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  // FDR-0014: react-custom-roulette-r19 (Lucky Wheel) ships its layout as
  // styled-components. Without this flag, Next's SWC compiler doesn't
  // transform styled-components for App Router SSR, so those components'
  // CSS rules (e.g. the wheel's own max-width: 445px) can fail to apply on
  // first client render -- exactly the "wheel has no size limit and spills
  // out of the popup" bug observed 2026-09-22. Sanity Studio also ships
  // styled-components; this flag benefits it identically, no conflict.
  compiler: {
    styledComponents: true,
  },
  // /about/concept described the first-edition backyard format; formats now live on /events/formats.
  async redirects() {
    return [
      { source: '/about/concept', destination: '/events/formats', permanent: true },
      { source: '/about/press', destination: '/about/partners', permanent: true },
    ]
  },
}

// Wrap with Sentry config
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "overbound",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  },
});
