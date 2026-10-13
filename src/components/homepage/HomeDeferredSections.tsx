'use client'

import dynamic from 'next/dynamic'

// Below-the-fold sections: split into their own chunks, but still rendered on
// the server so their content is in the HTML (SEO) and nothing pops in.
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'

const ObstaclesOverview = dynamic(
  () => import('@/components/homepage/ObstaclesOverview')
)

const SocialProof = dynamic(
  () => import('@/components/homepage/SocialProof')
)

const CTASection = dynamic(
  () => import('@/components/homepage/CTA')
)

const FAQ = dynamic(
  () => import('@/components/homepage/FAQ')
)

const VolunteersAppeal = dynamic(
  () => import('@/components/homepage/VolunteersAppeal')
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
