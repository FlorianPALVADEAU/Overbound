'use client'
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
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">

      <CheckoutButton />
    </div>
  );
}
