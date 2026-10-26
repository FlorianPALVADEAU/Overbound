import type { Metadata } from 'next';
import { loadFeaturedEvent } from '@/lib/events/loadFeaturedEvent';
import { FeaturedEventSeed } from '@/components/homepage/FeaturedEventSeed';
import HeroHeader from '@/components/homepage/HeroHeader';
import { NextEventSection } from '@/components/homepage/NextEventSection';
import { ConceptExplainer } from '@/components/homepage/ConceptExplainer';
import { EditionFacts } from '@/components/homepage/EditionFacts';
import { HomeFormatsSection } from '@/components/homepage/HomeFormatsSection';
import { HomeDeferredSections } from '@/components/homepage/HomeDeferredSections';
import { FaqSeed } from '@/components/homepage/FaqSeed';
import { fetchFaqQuestions } from '@/lib/faq/fetchFaqQuestions';
import { buildBaseMetadata } from './metadata';
import { loadNextEdition } from '@/lib/seo/loadNextEdition';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com').replace(/\/$/, '')

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata = buildBaseMetadata(await loadNextEdition());
  return {
    ...baseMetadata,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      ...baseMetadata.openGraph,
      url: siteUrl,
    },
  };
}

// Static page regenerated every minute: the featured event (price, spots)
// is read on the server and rendered into the HTML.
export const revalidate = 60;

export default async function Home() {
  // Every useFeaturedEvent() consumer (hero, next event, formats, CTA) then
  // renders with data on the first paint instead of popping in after a
  // client fetch. If the read fails, the client fetches as before.
  // Same for the FAQ: read from Sanity here, so the browser never calls it.
  const [featured, faq] = await Promise.all([
    loadFeaturedEvent().catch(() => null),
    fetchFaqQuestions().catch(() => null),
  ]);

  const sections = (
    <div className="flex h-full w-full flex-col">
      <HeroHeader />
      <NextEventSection />
      <ConceptExplainer />
      <HomeFormatsSection />
      <EditionFacts />
      <HomeDeferredSections />
    </div>
  );

  const withFaq = faq ? <FaqSeed data={faq}>{sections}</FaqSeed> : sections;
  return featured ? <FeaturedEventSeed data={featured}>{withFaq}</FeaturedEventSeed> : withFaq;
}
