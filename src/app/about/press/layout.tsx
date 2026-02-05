import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Espace Presse - Overbound Race | Course à Obstacles Paris 2026",
  description: "Espace presse Overbound Race : kit média, dossier de presse, contacts relations presse et partenariats. Course à obstacles Paris 2026, backyard OCR. presse@overbound-race.com",
  keywords: [
    "overbound presse",
    "overbound race médias",
    "partenariat course obstacles",
    "presse OCR france",
    "kit presse course obstacles paris",
    "backyard OCR presse",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/about/press'
  },
  openGraph: {
    title: "Espace Presse | Overbound Race - Course à Obstacles Paris 2026",
    description: "Ressources médias, contacts presse et partenariats pour Overbound Race.",
    url: 'https://overbound-race.com/about/press',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Espace Presse | Overbound Race",
    description: "Kit média, contacts presse et partenariats Overbound Race.",
  }
};

export default function PressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
