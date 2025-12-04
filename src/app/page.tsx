import type { Metadata } from 'next';
import CTA from '@/components/homepage/CTA';
import DistanceFormatsAndDifficulties from '@/components/homepage/DistanceFormatsAndDifficulties';
import FAQ from '@/components/homepage/FAQ';
import HeroHeader from '@/components/homepage/HeroHeader';
import NextEvents from '@/components/homepage/NextEvents';
import ObstaclesOverview from '@/components/homepage/ObstaclesOverview';
import SocialProof from '@/components/homepage/SocialProof';
import VolunteersAppeal from '@/components/homepage/VolunteersAppeal';
import WhatsOverbound from '@/components/homepage/WhatsOverbound';
import { PricingExplainer } from '@/components/pricing/PricingExplainer';

export const metadata: Metadata = {
  title: "Course d'obstacles à parcours personnalisable | Overbound Race",
  description: "La première course d'obstacles (OCR) à parcours personnalisables au monde. Choisis ta distance ET ta difficulté adaptée à TON niveau et relève ton défi ultime.",
  alternates: {
    canonical: 'https://overbound-race.com'
  },
  openGraph: {
    title: "Overbound Race - Course d'obstacles personnalisable",
    description: "La première course d'obstacles au monde où tu peux choisir ton propre parcours. Premiers événements en Île-de-France.",
    url: 'https://overbound-race.com',
    siteName: 'Overbound Race',
    images: [
      {
        url: "/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif",
        width: 1200,
        height: 630,
        alt: 'Overbound Race - La première course d\'obstacles à parcours personnalisables au monde',
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Overbound Race - Course d'obstacles personnalisable",
    description: "La première course d'obstacles au monde où tu peux choisir ton propre parcours.",
    images: ["/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif"],
  }
};

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
