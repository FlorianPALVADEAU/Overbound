import type { Metadata } from 'next';
import HeroHeader from '@/components/homepage/HeroHeader';
import NextEvents from '@/components/homepage/NextEvents';
import { HomeDeferredSections } from '@/components/homepage/HomeDeferredSections';
import WhatsOverbound from '@/components/homepage/WhatsOverbound';
import { PricingExplainer } from '@/components/pricing/PricingExplainer';
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

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col pb-20">
      <HeroHeader />
      <WhatsOverbound />
      <NextEvents />
      {/* Pricing Explainer Section */}
      <section className="w-full px-4 py-12 sm:px-6 xl:px-32">
          <PricingExplainer />
      </section>
      <HomeDeferredSections />
    </div>
  );
}
