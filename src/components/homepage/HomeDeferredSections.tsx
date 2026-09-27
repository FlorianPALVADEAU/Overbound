'use client'

import dynamic from 'next/dynamic'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'

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
  const { data } = useFeaturedEvent()
  const featuredEventId = data?.event?.id

  return (
    <>
      <ObstaclesOverview
        eventId={featuredEventId}
        title="Les obstacles"
        description="Un aperçu concret des ateliers qui vont tester ton grip, ton cardio et ton mental."
      />
      <SocialProof />
      <CTASection />
      <FAQ />
      {/* <RelevantBlogArticles /> */}
      <VolunteersAppeal />
    </>
  )
}
