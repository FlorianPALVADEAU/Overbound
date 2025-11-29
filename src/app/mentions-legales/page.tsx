import Link from 'next/link'
import { COMPANY_INFO } from '@/constants/companyInfo'

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
                <strong>Raison sociale :</strong> {COMPANY_INFO.legalName}
              </p>
              <p>
                <strong>Forme juridique :</strong> {COMPANY_INFO.legalForm}
              </p>
              <p>
                <strong>Capital social :</strong> {COMPANY_INFO.capital}
              </p>
              <p>
                <strong>Siège social :</strong> {COMPANY_INFO.address.full}
              </p>
              <p>
                <strong>Immatriculation :</strong> {COMPANY_INFO.rcs.full}
              </p>
              <p>
                <strong>Numéro de TVA intracommunautaire :</strong> {COMPANY_INFO.vat}
              </p>
            </div>
          </section>

          {/* Directeur de la publication */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Directeur de la publication</h2>
            <p className="mt-4">
              <strong>{COMPANY_INFO.director.name}</strong>, {COMPANY_INFO.director.title} de la société {COMPANY_INFO.legalName}
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Contact</h2>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Email général :</strong>{' '}
                <Link href={`mailto:${COMPANY_INFO.emails.general}`} className="text-primary hover:underline">
                  {COMPANY_INFO.emails.general}
                </Link>
              </p>
              <p>
                <strong>Email support :</strong>{' '}
                <Link href={`mailto:${COMPANY_INFO.emails.support}`} className="text-primary hover:underline">
                  {COMPANY_INFO.emails.support}
                </Link>
              </p>
              <p>
                <strong>Téléphone :</strong> {COMPANY_INFO.contact.phone}
              </p>
              <p>
                <strong>Horaires du support client :</strong> {COMPANY_INFO.supportHours}
              </p>
            </div>
          </section>

          {/* Hébergement */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold">Hébergement</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-semibold">Hébergeur du site web :</p>
                <p>{COMPANY_INFO.hosting.web.name}</p>
                <p>{COMPANY_INFO.hosting.web.address}</p>
                <p>
                  Site web :{' '}
                  <Link
                    href={COMPANY_INFO.hosting.web.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {COMPANY_INFO.hosting.web.website}
                  </Link>
                </p>
              </div>
              <div>
                <p className="font-semibold">Hébergeur de la base de données :</p>
                <p>{COMPANY_INFO.hosting.database.name}</p>
                <p>{COMPANY_INFO.hosting.database.address}</p>
                <p>
                  Site web :{' '}
                  <Link
                    href={COMPANY_INFO.hosting.database.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {COMPANY_INFO.hosting.database.website}
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
              <Link href={`mailto:${COMPANY_INFO.contact.email}`} className="text-primary hover:underline">
                {COMPANY_INFO.contact.email}
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
