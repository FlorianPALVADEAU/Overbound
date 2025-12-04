import { Metadata } from "next";

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
