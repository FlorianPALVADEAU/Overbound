'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle2, Settings } from 'lucide-react'
import { COMPANY_INFO } from '@/constants/companyInfo'
import { ConsentReset } from '@/components/consent/ConsentReset'
import { Container, Section } from '@/components/ds'
import { LegalHeader } from '@/components/legal/LegalHeader'

const lastUpdated = '11/10/2026'

const COOKIE_CATEGORIES = [
  {
    id: 'necessary',
    title: 'Cookies strictement nécessaires',
    icon: Shield,
    required: true,
    description:
      'Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés. Ils ne nécessitent pas de consentement.',
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
      {
        name: 'overbound-consent',
        purpose: 'Mémoriser ton choix sur les cookies (les choix, la date ; un justificatif est conservé côté serveur avec une adresse IP tronquée)',
        provider: 'Overbound',
        duration: '12 mois',
        type: 'LocalStorage',
      },
      {
        name: 'Paramètres de campagne (utm_*)',
        purpose: 'Savoir quelle campagne t’a amené sur le site, uniquement pour nos statistiques internes de commande',
        provider: 'Overbound',
        duration: '30 jours',
        type: 'LocalStorage',
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'Suivi des erreurs (sans consentement)',
    icon: Settings,
    required: true,
    description:
      'Nous détectons les erreurs techniques pour les corriger. Cette mesure est anonyme : aucune adresse IP ni donnée de profil n’est transmise, et aucune session n’est enregistrée sans ton accord.',
    cookies: [
      {
        name: 'Sentry (erreurs et performances)',
        purpose: 'Détecter et corriger les erreurs techniques du site',
        provider: 'Sentry (monitoring, hébergé dans l’Union européenne)',
        duration: 'Aucun cookie déposé',
        type: 'Requêtes techniques',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Mesure d’audience (avec consentement)',
    icon: Settings,
    required: false,
    description:
      'Ces traceurs mesurent la fréquentation et les parcours pour améliorer le site. Ils ne sont chargés qu’après ton accord.',
    cookies: [
      {
        name: '_ga, _ga_*',
        purpose: 'Mesure d’audience et statistiques d’usage du site',
        provider: 'Google Analytics',
        duration: '13 mois',
        type: 'Cookie HTTP',
      },
      {
        name: 'Google Tag Manager',
        purpose: 'Chargement des balises de mesure',
        provider: 'Google',
        duration: 'Session',
        type: 'Script',
      },
      {
        name: 'Enregistrement de session',
        purpose: 'Rejouer certaines sessions pour comprendre un bug. Tous les textes saisis et médias sont masqués',
        provider: 'Sentry Session Replay',
        duration: 'Session',
        type: 'SessionStorage',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Publicité (avec consentement)',
    icon: Settings,
    required: false,
    description:
      'Ces traceurs mesurent l’efficacité de nos campagnes publicitaires sur Facebook et Instagram. Ils ne sont chargés qu’après ton accord. Sans accord, aucun achat n’est transmis à Meta.',
    cookies: [
      {
        name: '_fbp, _fbc',
        purpose: 'Mesurer les conversions de nos publicités Meta et transmettre à Meta tes achats (email chiffré, adresse IP, navigateur)',
        provider: 'Meta Platforms Ireland (Meta Pixel et API de conversions)',
        duration: '3 mois',
        type: 'Cookie HTTP',
      },
    ],
  },
]

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <LegalHeader
        title="Politique de Cookies"
        lead="Comment nous utilisons les cookies et technologies similaires sur Overbound"
        size="prose"
        updated={
          <>
            Dernière mise à jour : <time dateTime="2026-02-10">{lastUpdated}</time>
          </>
        }
      />
      <Section spacing="compact">
      <Container size="prose">

        {/* Introduction */}
        <div className="prose-overbound mb-12">
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
              Chez Overbound, nous utilisons un nombre minimal de cookies. Les cookies de mesure d’audience et de
              publicité ne sont déposés <strong>qu’avec votre accord</strong>, finalité par finalité, et vous pouvez les
              refuser sans conséquence sur votre inscription.
            </p>
            <p>Nos cookies et traceurs sont classés en quatre catégories :</p>
            <ul>
              <li>
                <strong>Cookies strictement nécessaires :</strong> Indispensables au fonctionnement du site
                (authentification, paiement sécurisé). Ces cookies ne nécessitent pas votre consentement.
              </li>
              <li>
                <strong>Suivi des erreurs :</strong> Anonyme, sans cookie, pour corriger les erreurs techniques.
              </li>
              <li>
                <strong>Mesure d’audience :</strong> Google Analytics, Google Tag Manager, enregistrement de session
                masqué. Uniquement avec votre consentement.
              </li>
              <li>
                <strong>Publicité :</strong> Meta Pixel et API de conversions. Uniquement avec votre consentement.
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

        <div className="mb-12">
          <ConsentReset />
        </div>

        {/* Cookie management */}
        <div className="prose-overbound mb-12">
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

            <div className="my-6 rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-medium text-foreground">
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
                <strong>Cookies persistants :</strong> Conservés pour une durée déterminée (de 7 jours à 13 mois maximum)
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
              <li>Mémoriser votre choix de consentement et la campagne qui vous a amené sur le site</li>
              <li>Améliorer les performances en mettant en cache certaines données</li>
              <li>Détecter et diagnostiquer les erreurs techniques de façon anonyme (Sentry)</li>
              <li>Enregistrer votre choix de consentement aux cookies d’audience et de publicité</li>
            </ul>
            <p>
              Ces données sont stockées localement sur votre appareil et ne sont pas transmises à des tiers, sauf pour
              le service de suivi d'erreurs (Sentry) et, si vous les avez acceptés, les services de mesure d’audience et de publicité.
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
              Vous pouvez retirer votre consentement à tout moment depuis la section « Gérer mes préférences » ci-dessus
              ou le lien « Gérer mes cookies » en bas de chaque page. Votre choix est renouvelé tous les 12 mois.
            </p>
            <p>
              Pour toute question concernant notre utilisation des cookies, vous pouvez nous contacter à l'adresse{' '}
              <Link href={`mailto:${COMPANY_INFO.emails.privacy}`} className="text-primary underline">
                {COMPANY_INFO.emails.privacy}
              </Link>{' '}
              ou consulter notre{' '}
              <Link href="/privacy-policies" className="text-primary underline">
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
              <Link href="/privacy-policies" className="text-primary underline">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/cgu" className="text-primary underline">
                Conditions Générales d'Utilisation (CGU)
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="text-primary underline">
                Conditions Générales de Vente (CGV)
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="text-primary underline">
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      </Section>
    </main>
  )
}
