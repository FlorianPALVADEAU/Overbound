'use client'
import CTA from '@/components/homepage/CTA';
import DistanceFormatsAndDifficulties from '@/components/homepage/DistanceFormatsAndDifficulties';
import FAQ from '@/components/homepage/FAQ';
import HeroHeader from '@/components/homepage/HeroHeader';
import NextEvents from '@/components/homepage/NextEvents';
import ObstaclesOverview from '@/components/homepage/ObstaclesOverview';
import SocialProof from '@/components/homepage/SocialProof';
import VolunteersAppeal from '@/components/homepage/VolunteersAppeal';
import WhatsOverbound from '@/components/homepage/WhatsOverbound';
import { Button } from '@/components/ui/button';

function CheckoutButton() {
// Bouton
  const onClick = async () => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        priceId: 'price_1Rwn7WGbpNzT0HskUoQrdfmI',
        userId: 'your_user_id',
      }),
    });
    const { data, url, error } = await res.json();
    console.log('checkout response', data);

    if (!res.ok || !url) {
      console.error(error || 'Stripe checkout: url manquante');
      return;
    }
    window.location.assign(url);
  };

  return <Button onClick={onClick} className="btn">Payes chakal</Button>
}

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
