'use client'

import dynamic from 'next/dynamic'

const DistanceFormatsAndDifficulties = dynamic(
  () => import('@/components/homepage/DistanceFormatsAndDifficulties'),
  { ssr: false },
)

const ObstaclesOverview = dynamic(
  () => import('@/components/homepage/ObstaclesOverview'),
  { ssr: false },
)

const SocialProof = dynamic(
  () => import('@/components/homepage/SocialProof'),
  { ssr: false },
)

const CTASection = dynamic(
  () => import('@/components/homepage/CTA'),
  { ssr: false },
)

const FAQ = dynamic(
  () => import('@/components/homepage/FAQ'),
  { ssr: false },
)

const VolunteersAppeal = dynamic(
  () => import('@/components/homepage/VolunteersAppeal'),
  { ssr: false },
)

export function HomeDeferredSections() {
  return (
    <>
      <DistanceFormatsAndDifficulties />
      <ObstaclesOverview />
      <SocialProof />
      <CTASection />
      <FAQ />
      {/* <RelevantBlogArticles /> */}
      <VolunteersAppeal />
    </>
  )
}
