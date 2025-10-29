import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "@/components/layout/Layout";
import ClientProviders from '@/components/ClientProviders'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Overbound Race - Course d'obstacles uniques et personnalisables",
  description: "La première course d'obstacles à proposer des choix de parcours personnalisables, inspirée des rites tribaux et de l'esprit collectif.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          <Layout>{children}</Layout>
        </ClientProviders>
      </body>
    </html>
  );
}