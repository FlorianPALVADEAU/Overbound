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

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col pb-20">
      <HeroHeader />
      <WhatsOverbound />
      <NextEvents />
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
