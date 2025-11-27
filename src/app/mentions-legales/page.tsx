import Link from 'next/link'

const lastUpdated = '27/11/2024'

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Mentions légales</h1>
          <p className="text-lg text-muted-foreground">
            Informations légales concernant le site Overbound
          </p>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : <time dateTime="2024-11-27">{lastUpdated}</time>
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert sm:prose lg:prose-lg">
          {/* Éditeur du site */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Éditeur du site</h2>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Raison sociale :</strong> Overbound SAS
              </p>
              <p>
                <strong>Forme juridique :</strong> Société par Actions Simplifiée
              </p>
              <p>
                <strong>Capital social :</strong> 50 000 €
              </p>
              <p>
                <strong>Siège social :</strong> 24 rue du Faubourg Saint-Martin, 75010 Paris, France
              </p>
              <p>
                <strong>Immatriculation :</strong> RCS de Paris sous le numéro 922 345 678
              </p>
              <p>
                <strong>Numéro de TVA intracommunautaire :</strong> FR18 922345678
              </p>
            </div>
          </section>

          {/* Directeur de la publication */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Directeur de la publication</h2>
            <p className="mt-4">
              <strong>Florian Palvadeau</strong>, Président de la société Overbound SAS
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Contact</h2>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Email général :</strong>{' '}
                <Link href="mailto:contact@overbound-race.com" className="text-primary hover:underline">
                  contact@overbound-race.com
                </Link>
              </p>
              <p>
                <strong>Email support :</strong>{' '}
                <Link href="mailto:support@overbound-race.com" className="text-primary hover:underline">
                  support@overbound-race.com
                </Link>
              </p>
              <p>
                <strong>Téléphone :</strong> +33 (0)1 84 80 12 34
              </p>
              <p>
                <strong>Horaires du support client :</strong> Du lundi au vendredi, 9h00 – 18h00 (CET)
              </p>
            </div>
          </section>

          {/* Hébergement */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Hébergement</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-semibold">Hébergeur du site web :</p>
                <p>Vercel Inc.</p>
                <p>340 S Lemon Ave #4133</p>
                <p>Walnut, CA 91789, États-Unis</p>
                <p>
                  Site web :{' '}
                  <Link
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://vercel.com
                  </Link>
                </p>
              </div>
              <div>
                <p className="font-semibold">Hébergeur de la base de données :</p>
                <p>Supabase Inc.</p>
                <p>970 Toa Payoh North #07-04</p>
                <p>Singapour</p>
                <p>
                  Site web :{' '}
                  <Link
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://supabase.com
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Propriété intellectuelle</h2>
            <p className="mt-4">
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, marques, etc.) est la propriété
              exclusive d'Overbound SAS ou fait l'objet d'une autorisation d'utilisation. Toute reproduction,
              représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que
              soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable d'Overbound.
            </p>
            <p className="mt-4">
              Le non-respect de cette interdiction constitue une contrefaçon pouvant engager la responsabilité civile
              et pénale du contrefacteur.
            </p>
          </section>

          {/* Crédits */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Crédits</h2>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Conception et développement :</strong> Overbound SAS
              </p>
              <p>
                <strong>Photographies :</strong> Unsplash, photographes crédités
              </p>
            </div>
          </section>

          {/* Données personnelles */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Données personnelles et cookies</h2>
            <p className="mt-4">
              Pour en savoir plus sur la collecte et le traitement de vos données personnelles, veuillez consulter
              notre{' '}
              <Link href="/privacy-policies" className="text-primary hover:underline">
                Politique de confidentialité
              </Link>
              .
            </p>
            <p className="mt-4">
              Pour en savoir plus sur l'utilisation des cookies sur notre site, veuillez consulter notre{' '}
              <Link href="/cookies" className="text-primary hover:underline">
                Politique de cookies
              </Link>
              .
            </p>
          </section>

          {/* Conditions générales */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Conditions générales</h2>
            <p className="mt-4">
              Pour connaître les conditions d'utilisation de notre plateforme, veuillez consulter nos{' '}
              <Link href="/cgu" className="text-primary hover:underline">
                Conditions Générales d'Utilisation
              </Link>{' '}
              et nos{' '}
              <Link href="/cgv" className="text-primary hover:underline">
                Conditions Générales de Vente
              </Link>
              .
            </p>
          </section>

          {/* Litiges */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Litiges et réclamations</h2>
            <p className="mt-4">
              En cas de litige ou de réclamation, nous vous invitons à nous contacter en priorité à l'adresse{' '}
              <Link href="mailto:contact@overbound-race.com" className="text-primary hover:underline">
                contact@overbound-race.com
              </Link>
              .
            </p>
            <p className="mt-4">
              Conformément à l'article L.612-1 du Code de la consommation, tout consommateur a le droit de recourir
              gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige qui l'oppose à
              un professionnel.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
