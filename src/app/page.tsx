'use client'
import CTA from '@/components/homepage/CTA';
import DistanceFormatsAndDifficulties from '@/components/homepage/DistanceFormatsAndDifficulties';
import FAQ from '@/components/homepage/FAQ';
import HeroHeader from '@/components/homepage/HeroHeader';
import NextEvents from '@/components/homepage/NextEvents';
import ObstaclesOverview from '@/components/homepage/ObstaclesOverview';
import SocialProof from '@/components/homepage/SocialProof';
import VolunteersAppeal from '@/components/homepage/VolunteersAppeal';
import RelevantBlogArticles from '@/components/homepage/RelevantBlogArticles';
import WhatsOverbound from '@/components/homepage/WhatsOverbound';
import { PricingExplainer } from '@/components/pricing/PricingExplainer';

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
      <DistanceFormatsAndDifficulties />
      <ObstaclesOverview />
      <SocialProof />
      <CTA />
      <FAQ />
      {/* <RelevantBlogArticles /> */}
      <VolunteersAppeal />
    </div>
  );
}
