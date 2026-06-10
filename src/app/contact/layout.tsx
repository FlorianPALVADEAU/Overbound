import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Overbound Race | Course à Obstacles Paris 2026",
  description: "Contacte le support Overbound Race : inscriptions, modifications de dossard, documents et partenariats. Course à obstacles Paris 2026, backyard OCR.",
  keywords: [
    "contact overbound",
    "support course obstacles",
    "inscription overbound race",
    "contact OCR paris",
    "aide course obstacles",
    "partenariat overbound",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/contact'
  },
  openGraph: {
    title: "Contact Overbound Race | Course à Obstacles Paris 2026",
    description: "Notre équipe support t'accompagne. Course à obstacles Paris 2026, backyard OCR.",
    url: 'https://overbound-race.com/contact',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/hero_header_poster.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Overbound Race',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact | Overbound Race",
    description: "Service support pour la course à obstacles Paris 2026 et le backyard OCR.",
    images: ['/images/hero_header_poster.jpg'],
  }
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
