'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle2, Settings } from 'lucide-react'

const lastUpdated = '27/11/2024'

const COOKIE_CATEGORIES = [
  {
    id: 'necessary',
    title: 'Cookies strictement nécessaires',
    icon: Shield,
    required: true,
    description: 'Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.',
    cookies: [
      {
        name: 'sb-*-auth-token',
        purpose: 'Authentification et gestion de session utilisateur',
        provider: 'Supabase (authentification)',
        duration: '7 jours',
        type: 'Cookie HTTP',
      },
      {
        name: '__stripe_*',
        purpose: 'Sécurisation des paiements et prévention de la fraude',
        provider: 'Stripe (paiement)',
        duration: 'Session',
        type: 'Cookie HTTP',
      },
    ],
  },
  {
    id: 'performance',
    title: 'Cookies de performance',
    icon: Settings,
    required: false,
    description:
      'Ces cookies nous permettent de suivre les erreurs et améliorer la performance du site. Ils ne collectent pas d\'informations personnellement identifiables.',
    cookies: [
      {
        name: 'sentry-*',
        purpose: 'Suivi des erreurs et monitoring des performances',
        provider: 'Sentry (monitoring)',
        duration: '1 an',
        type: 'Cookie HTTP + LocalStorage',
      },
    ],
  },
]

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Politique de Cookies</h1>
          <p className="text-lg text-muted-foreground">
            Comment nous utilisons les cookies et technologies similaires sur Overbound
          </p>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : <time dateTime="2024-11-27">{lastUpdated}</time>
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-sm mb-12 max-w-none dark:prose-invert sm:prose lg:prose-lg">
          <section className="mb-12">
            <h2 className="text-2xl font-bold">Qu'est-ce qu'un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de
              la visite d'un site web. Les cookies permettent au site de reconnaître votre appareil lors de vos
              prochaines visites et d'améliorer votre expérience utilisateur.
            </p>
            <p>
              Les cookies peuvent être déposés par le site que vous visitez (cookies « first party ») ou par des
              services tiers utilisés par le site (cookies « third party »).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold">Comment utilisons-nous les cookies ?</h2>
            <p>
              Chez Overbound, nous utilisons un nombre minimal de cookies, uniquement pour assurer le bon
              fonctionnement du site et améliorer votre expérience. Nous ne déployons{' '}
              <strong>aucun cookie publicitaire ou de tracking marketing</strong>.
            </p>
            <p>Nos cookies sont classés en deux catégories :</p>
            <ul>
              <li>
                <strong>Cookies strictement nécessaires :</strong> Indispensables au fonctionnement du site
                (authentification, paiement sécurisé). Ces cookies ne nécessitent pas votre consentement.
              </li>
              <li>
                <strong>Cookies de performance :</strong> Nous aident à détecter et corriger les erreurs techniques.
                Ces cookies sont déposés uniquement avec votre consentement.
              </li>
            </ul>
          </section>
        </div>

        {/* Cookie Categories */}
        <div className="mb-12 space-y-6">
          <h2 className="text-3xl font-bold">Cookies utilisés sur notre site</h2>

          {COOKIE_CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.id} className="border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    {category.required && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Requis
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.cookies.map((cookie, idx) => (
                      <div key={idx} className="rounded-lg border bg-muted/30 p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <h4 className="font-mono text-sm font-semibold">{cookie.name}</h4>
                          <span className="rounded-full bg-background px-2 py-1 text-xs font-medium">
                            {cookie.duration}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <strong>Objectif :</strong> {cookie.purpose}
                          </p>
                          <p>
                            <strong>Fournisseur :</strong> {cookie.provider}
                          </p>
                          <p>
                            <strong>Type :</strong> {cookie.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Cookie management */}
        <div className="prose prose-sm mb-12 max-w-none dark:prose-invert sm:prose lg:prose-lg">
          <section className="mb-12">
            <h2 className="text-2xl font-bold">Comment gérer les cookies ?</h2>

            <h3 className="text-xl font-bold">Via votre navigateur</h3>
            <p>Vous pouvez configurer votre navigateur pour accepter ou refuser les cookies :</p>
            <ul>
              <li>
                <strong>Google Chrome :</strong> Paramètres &gt; Confidentialité et sécurité &gt; Cookies
              </li>
              <li>
                <strong>Firefox :</strong> Paramètres &gt; Vie privée et sécurité &gt; Cookies et données de sites
              </li>
              <li>
                <strong>Safari :</strong> Préférences &gt; Confidentialité &gt; Cookies et données de sites web
              </li>
              <li>
                <strong>Edge :</strong> Paramètres &gt; Confidentialité &gt; Cookies et autorisations de site
              </li>
            </ul>

            <div className="my-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                ⚠️ Attention : Le blocage des cookies strictement nécessaires empêchera le bon fonctionnement du site,
                notamment la connexion à votre compte et le processus de paiement.
              </p>
            </div>

            <h3 className="text-xl font-bold">Suppression des cookies</h3>
            <p>Vous pouvez à tout moment supprimer les cookies déjà stockés sur votre appareil :</p>
            <ul>
              <li>Via les paramètres de votre navigateur (section « Effacer les données de navigation »)</li>
              <li>En utilisant les raccourcis clavier : Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold">Durée de conservation</h2>
            <p>La durée de conservation des cookies varie selon leur finalité :</p>
            <ul>
              <li>
                <strong>Cookies de session :</strong> Supprimés automatiquement à la fermeture de votre navigateur
              </li>
              <li>
                <strong>Cookies persistants :</strong> Conservés pour une durée déterminée (de 7 jours à 1 an maximum)
              </li>
            </ul>
            <p>
              Vous pouvez consulter la durée spécifique de chaque cookie dans les tableaux détaillés ci-dessus.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold">Technologies similaires</h2>
            <p>En plus des cookies, nous utilisons des technologies de stockage local (LocalStorage) pour :</p>
            <ul>
              <li>Conserver vos préférences d'affichage (thème sombre/clair)</li>
              <li>Améliorer les performances en mettant en cache certaines données</li>
              <li>Détecter et diagnostiquer les erreurs techniques (Sentry)</li>
            </ul>
            <p>
              Ces données sont stockées localement sur votre appareil et ne sont pas transmises à des tiers, sauf pour
              le service de monitoring d'erreurs (Sentry).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold">Modifications de cette politique</h2>
            <p>
              Nous pouvons être amenés à modifier cette politique de cookies pour refléter les changements dans nos
              pratiques ou pour des raisons légales. La date de dernière mise à jour est indiquée en haut de cette
              page.
            </p>
            <p>
              Nous vous encourageons à consulter régulièrement cette page pour rester informé de notre utilisation des
              cookies.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold">Contact</h2>
            <p>
              Pour toute question concernant notre utilisation des cookies, vous pouvez nous contacter à l'adresse{' '}
              <Link href="mailto:privacy@overbound-race.com" className="text-primary hover:underline">
                privacy@overbound-race.com
              </Link>{' '}
              ou consulter notre{' '}
              <Link href="/privacy-policies" className="text-primary hover:underline">
                Politique de confidentialité
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="rounded-lg border bg-muted/30 p-6">
          <h3 className="mb-4 font-semibold">Documents complémentaires</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/privacy-policies" className="text-primary hover:underline">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/cgu" className="text-primary hover:underline">
                Conditions Générales d'Utilisation (CGU)
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="text-primary hover:underline">
                Conditions Générales de Vente (CGV)
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="text-primary hover:underline">
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
