import Link from 'next/link'
import {
  MapPin,
  Users,
  Trophy,
  Tent,
  Timer,
  Zap,
  ShieldCheck,
  IdCard,
  Eye,
  Backpack,
  UserCheck,
  Camera,
  ArrowRightLeft,
  Utensils,
  Swords,
  CirclePlay,
} from 'lucide-react'

type InfoSection = {
  id: string
  icon: React.ElementType
  title: string
  content: React.ReactNode
}

const sections: InfoSection[] = [
  {
    id: 'rejoindre',
    icon: CirclePlay,
    title: "Rejoindre l'événement",
    content: (
      <div className="space-y-3">
        <p>
          Overbound est une course à obstacles nouvelle génération organisée sous forme de <strong>backyard</strong>,
          sur une boucle unique en pleine nature.
        </p>
        <p>
          Deux formats sont proposés : <strong>OPEN</strong> et <strong>RANKED</strong>, pour permettre à chacun de
          choisir son niveau d'engagement.
        </p>
        <p>L'événement est ouvert aux sportifs de tous niveaux, dès lors qu'ils sont majeurs.</p>
      </div>
    ),
  },
  {
    id: 'village',
    icon: Tent,
    title: 'Le Village Overbound',
    content: (
      <div className="space-y-3">
        <p>
          Le village Overbound est le <strong>coeur de l'événement</strong> : zone de départ et d'arrivée,
          partenaires, animations, musique et public.
        </p>
        <p>
          C'est un lieu vivant, pensé pour créer une ambiance forte et permettre aux spectateurs de suivre l'épreuve
          jusqu'au dernier survivant.
        </p>
      </div>
    ),
  },
  {
    id: 'course',
    icon: Trophy,
    title: 'La Course',
    content: (
      <div className="space-y-6">
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            Boucle d'environ <strong>2 km</strong>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Swords className="h-3.5 w-3.5" />
            </span>
            <strong>10 obstacles et plus</strong>, sollicitant force, endurance, agilité et mental
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Tent className="h-3.5 w-3.5" />
            </span>
            Parcours en <strong>milieu naturel</strong>
          </li>
        </ul>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Zap className="h-4 w-4" />
              </span>
              <h4 className="text-lg font-bold text-foreground">OPEN</h4>
            </div>
            <p className="text-sm leading-relaxed">
              Format accessible, <strong>sans élimination</strong>. Les participants disposent d'un temps de course
              global et gèrent librement leurs tours, leurs pauses, leur nutrition et leur récupération.
            </p>
            <p className="mt-3 text-sm font-medium text-primary">
              L'objectif : se dépasser à son rythme, dans un cadre encadré et sécurisé.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-orange-500/20 bg-orange-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                <Timer className="h-4 w-4" />
              </span>
              <h4 className="text-lg font-bold text-foreground">RANKED</h4>
            </div>
            <p className="text-sm leading-relaxed">
              Format compétitif à <strong>élimination progressive</strong>. Un départ est donné toutes les 20
              minutes. Les participants doivent terminer chaque boucle dans le temps imparti sous peine
              d'élimination.
            </p>
            <p className="mt-3 text-sm font-medium text-orange-600 dark:text-orange-400">
              La course s'arrête lorsqu'il ne reste plus qu'un seul participant en compétition.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'apres-course',
    icon: Utensils,
    title: 'Après ta course',
    content: (
      <p>
        Après l'effort, place à la <strong>récupération et au partage</strong> : repos au village, échanges avec les
        autres participants, partenaires, public et ambiance conviviale.
      </p>
    ),
  },
  {
    id: 'billet',
    icon: ArrowRightLeft,
    title: 'Ton billet',
    content: (
      <div className="space-y-3">
        <p>Ton billet te donne accès :</p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            à la course choisie (OPEN ou RANKED)
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            au village Overbound
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            aux services mis à disposition sur site
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Les informations pratiques (guide du coureur) seront envoyées par email avant l'événement.
        </p>
      </div>
    ),
  },
  {
    id: 'lieu',
    icon: MapPin,
    title: "Lieu de l'événement",
    content: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-primary/5 p-4">
          <p className="text-lg font-semibold text-foreground">Base de loisirs de Saint-Quentin-en-Yvelines</p>
          <p className="text-sm text-muted-foreground">Yvelines - Ile-de-France</p>
        </div>
        <p className="text-sm text-muted-foreground">
          L'accès précis et les informations de stationnement seront communiqués dans le Guide du Coureur.
        </p>
      </div>
    ),
  },
  {
    id: 'conditions',
    icon: ShieldCheck,
    title: 'Conditions de participation & sécurité',
    content: (
      <div className="space-y-4">
        <p>Pour participer, chaque participant devra obligatoirement présenter le jour de l'événement :</p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span>
              un <strong>PPS (Parcours Prévention Santé)</strong> valide{' '}
              <Link
                href="https://pps.athle.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                pps.athle.fr
              </Link>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            ou un <strong>certificat médical</strong> en cours de validité attestant l'absence de contre-indication à
            la pratique du sport
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            ou une <strong>licence sportive</strong> valide pour l'année de l'événement
          </li>
        </ul>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Important</p>
          <p className="mt-1 text-destructive/80">
            En l'absence de l'un de ces documents, l'accès à la course sera refusé. Aucun remboursement ne pourra
            être effectué.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'enregistrement',
    icon: IdCard,
    title: 'Enregistrement',
    content: (
      <div className="space-y-3">
        <p>
          Merci de prévoir une <strong>pièce d'identité</strong> (carte d'identité, permis de conduire, carte
          étudiante, etc.).
        </p>
        <p className="text-sm text-muted-foreground">Une photo du document sur téléphone est acceptée.</p>
      </div>
    ),
  },
  {
    id: 'spectateurs',
    icon: Eye,
    title: 'Spectateurs',
    content: (
      <div className="space-y-3">
        <p>
          Les spectateurs sont les bienvenus sur le <strong>village Overbound</strong> et les zones dédiées.
        </p>
        <p className="text-sm text-muted-foreground">
          Pour des raisons de sécurité, l'accès au parcours leur est strictement interdit.
        </p>
      </div>
    ),
  },
  {
    id: 'depot-sac',
    icon: Backpack,
    title: 'Dépôt de sac',
    content: (
      <div className="space-y-3">
        <p>Un espace de dépôt de sacs sera disponible sur site.</p>
        <p className="text-sm text-muted-foreground">
          Les modalités exactes seront précisées dans le Guide du Coureur.
        </p>
      </div>
    ),
  },
  {
    id: 'age',
    icon: UserCheck,
    title: 'Age minimum',
    content: (
      <p>
        Événement réservé aux <strong>majeurs (18 ans minimum)</strong>.
      </p>
    ),
  },
  {
    id: 'photos',
    icon: Camera,
    title: 'Photos & contenus',
    content: (
      <div className="space-y-3">
        <p>Des photographes officiels seront présents sur l'événement.</p>
        <p>Les photos seront mises en ligne dans les jours suivant la course.</p>
        <p className="text-sm text-muted-foreground">
          Les liens seront communiqués par email et sur les réseaux sociaux.
        </p>
      </div>
    ),
  },
  {
    id: 'transfert',
    icon: ArrowRightLeft,
    title: 'Transfert de billet',
    content: (
      <div className="space-y-3">
        <p>
          Les modalités de modification ou de transfert de billet seront précisées dans le Guide du Coureur.
        </p>
        <p className="text-sm text-muted-foreground">
          Certaines modifications pourront être effectuées directement en ligne.
        </p>
      </div>
    ),
  },
]

export default function EventInfoSections() {
  return (
    <section className="bg-background py-16">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Informations générales
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Tout savoir sur l'événement
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Retrouve ici toutes les informations pratiques pour préparer ta venue et vivre l'expérience Overbound
            dans les meilleures conditions.
          </p>
        </div>

        <div className="space-y-6">
          {/* Main info: Rejoindre + Village + Course in a featured layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {sections.slice(0, 2).map((section) => (
              <div
                key={section.id}
                id={`info-${section.id}`}
                className="rounded-3xl border border-border bg-card/80 p-8 shadow-lg shadow-primary/5 transition hover:shadow-primary/10"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <section.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground">{section.content}</div>
              </div>
            ))}
          </div>

          {/* La Course - Full width featured section */}
          {sections[2] && (() => {
            const FeaturedIcon = sections[2].icon
            return (
              <div
                id={`info-${sections[2].id}`}
                className="rounded-3xl border-2 border-primary/20 bg-card/80 p-8 shadow-lg shadow-primary/10"
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FeaturedIcon className="h-6 w-6" />
                  </span>
                  <h3 className="text-2xl font-bold text-foreground">{sections[2].title}</h3>
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground">{sections[2].content}</div>
              </div>
            )
          })()}

          {/* Grid for remaining sections */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sections.slice(3).map((section) => (
              <div
                key={section.id}
                id={`info-${section.id}`}
                className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm shadow-primary/5 transition hover:shadow-primary/10"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <section.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
