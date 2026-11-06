import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { IMAGE_QUALITIES, REMOTE_IMAGE_PATTERNS } from './src/lib/images/imageSource'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: IMAGE_QUALITIES,
    remotePatterns: REMOTE_IMAGE_PATTERNS.map((pattern) => ({ ...pattern })),
  },
  // Sanity Studio ships styled-components; without this flag Next's SWC
  // compiler doesn't transform them for App Router SSR.
  compiler: {
    styledComponents: true,
  },
  // Static assets in public/ have stable names but are not fingerprinted:
  // a week of browser cache, then revalidation in the background.
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }]
    return [
      { source: '/images/:path*', headers: cache },
      { source: '/videos/:path*', headers: cache },
    ]
  },
  // /about/concept described the first-edition backyard format; formats now live on /events/formats.
  async redirects() {
    return [
      { source: '/about/concept', destination: '/events/formats', permanent: true },
      { source: '/about/press', destination: '/about/partners', permanent: true },
      // Training pages were replaced by bootcamps.
      { source: '/trainings', destination: '/bootcamps', permanent: true },
      { source: '/trainings/:path*', destination: '/bootcamps', permanent: true },
      // Blog articles merged into a single canonical one.
      {
        source: '/blog/post/pourquoi-penalites-differentes-open-ranked',
        destination: '/blog/post/open-vs-ranked-choisir-son-format',
        permanent: true,
      },
      {
        source: '/blog/post/overbound-face-spartan-tough-mudder-course-a-obstacles',
        destination: '/blog/post/spartan-race-vs-overbound-quelle-course-a-obstacles-choisir',
        permanent: true,
      },
      {
        source: '/blog/post/course-a-obstacles-sans-montre',
        destination: '/blog/post/open-vs-ranked-choisir-son-format',
        permanent: true,
      },
      {
        source: '/blog/post/comment-se-construit-une-course-a-obstacles',
        destination: '/overbound-en-bref',
        permanent: true,
      },
      {
        source: '/blog/post/overbound-vision-moyen-terme',
        destination: '/about/our-story',
        permanent: true,
      },
      {
        source: '/blog/post/overbound-dans-les-yvelines-ce-que-ca-apporte',
        destination: '/blog/post/bilan-premiere-edition-ultra-arena-2026',
        permanent: true,
      },
      {
        source: '/blog/post/courses-a-obstacles-les-plus-hardcore-qui-doit-y-aller',
        destination: '/blog/post/spartan-race-vs-overbound-quelle-course-a-obstacles-choisir',
        permanent: true,
      },
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
