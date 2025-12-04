import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Espace Presse - Kit média et contacts | Overbound Race",
  description: "Espace presse Overbound Race : kit média, logos, photos événements, communiqués. Contacts presse et partenariats. Email : presse@overbound-race.com",
  alternates: {
    canonical: 'https://overbound-race.com/about/press'
  },
  openGraph: {
    title: "Espace Presse - Overbound Race",
    description: "Kit média, logos et ressources pour la presse.",
    url: 'https://overbound-race.com/about/press',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function PressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
