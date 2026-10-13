import type { Metadata } from 'next';
import { loadFeaturedEvent } from '@/lib/events/loadFeaturedEvent';
import { FeaturedEventSeed } from '@/components/homepage/FeaturedEventSeed';
import HeroHeader from '@/components/homepage/HeroHeader';
import { NextEventSection } from '@/components/homepage/NextEventSection';
import { ConceptExplainer } from '@/components/homepage/ConceptExplainer';
import { HomeFormatsSection } from '@/components/homepage/HomeFormatsSection';
import { HomeDeferredSections } from '@/components/homepage/HomeDeferredSections';
import { metadata as baseMetadata } from './metadata';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com').replace(/\/$/, '')

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    ...baseMetadata.openGraph,
    url: siteUrl,
  },
};

// Static page regenerated every minute: the featured event (price, spots)
// is read on the server and rendered into the HTML.
export const revalidate = 60;

export default async function Home() {
  // Every useFeaturedEvent() consumer (hero, next event, formats, CTA) then
  // renders with data on the first paint instead of popping in after a
  // client fetch. If the read fails, the client fetches as before.
  const featured = await loadFeaturedEvent().catch(() => null);

  const sections = (
    <div className="flex h-full w-full flex-col">
      <HeroHeader />
      <NextEventSection />
      <ConceptExplainer />
      <HomeFormatsSection />
      <HomeDeferredSections />
    </div>
  );

  return featured ? <FeaturedEventSeed data={featured}>{sections}</FeaturedEventSeed> : sections;
}
