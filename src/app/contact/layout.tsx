import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact - Service Support Overbound Race | Aide & Questions",
  description: "Contactez le support Overbound Race : inscriptions, modifications de dossard, documents à envoyer, partenariats médias. Email : contact@overbound-race.com",
  alternates: {
    canonical: 'https://overbound-race.com/contact'
  },
  openGraph: {
    title: "Contact - Support Overbound Race",
    description: "Notre équipe support vous accompagne avant, pendant et après votre course. Contactez-nous par email ou formulaire.",
    url: 'https://overbound-race.com/contact',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact Overbound Race",
    description: "Service support disponible pour toutes vos questions.",
  }
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
