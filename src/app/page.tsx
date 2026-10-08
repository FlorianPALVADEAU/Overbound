import type { Metadata } from 'next';
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

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col pb-20">
      <HeroHeader />
      <NextEventSection />
      <ConceptExplainer />
      <HomeFormatsSection />
      <HomeDeferredSections />
    </div>
  );
}
