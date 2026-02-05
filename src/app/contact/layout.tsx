import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact - Support Overbound Race | Course à Obstacles Paris 2026",
  description: "Contacte le support Overbound Race : inscriptions, modifications de dossard, documents, partenariats. Course à obstacles Paris 2026, backyard OCR. contact@overbound-race.com",
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
    title: "Contact - Support Overbound Race | Course à Obstacles Paris 2026",
    description: "Notre équipe support t'accompagne. Course à obstacles Paris 2026, backyard OCR.",
    url: 'https://overbound-race.com/contact',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact | Overbound Race",
    description: "Service support disponible pour toutes tes questions.",
  }
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
