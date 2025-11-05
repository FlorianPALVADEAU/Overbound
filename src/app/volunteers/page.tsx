'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Headings from '@/components/globals/Headings'
import SubHeadings from '@/components/globals/SubHeadings'
import { VolunteerFAQSection } from '@/components/volunteers/VolunteerFAQSection'
import { cn } from '@/lib/utils'
import { useSession } from '@/app/api/session/sessionQueries'

const testimonials = [
	{
		quote:
		'Je suis arrivé pour donner un coup de main, je suis reparti avec une famille. Voir les coureurs franchir la ligne grâce à nous est indescriptible.',
		name: 'Amandine, chef de zone obstacles',
	},
	{
		quote:
		'Être volontaire, c’est sentir l’énergie d’Overbound de l’intérieur. J’ai découvert des amis, un sens et un défi humain incroyable.',
		name: 'Sébastien, responsable ravitaillement',
	},
	{
		quote:
		'On partage les mêmes valeurs que les athlètes : entraide, dépassement, fierté collective. C’est l’expérience la plus inspirante de mon année.',
		name: 'Lina, accueil participants',
	},
]

const missions = [
	{
		title: 'Tribu obstacles',
		description:
		'Rejoins l’équipe qui gère nos modules iconiques. Tu encourages, assures la sécurité et aides les coureurs à repartir plus forts.',
	},
	{
		title: 'Logistique & village',
		description:
		'Accueil participants, remise des dossards, gestion du flux, logistique matériel. Tu es le premier sourire que les athlètes croisent.',
	},
	{
		title: 'Ravitaillement & récupération',
		description:
		'Tu accompagnes les coureurs sur les zones critiques : ravitos, finish line, consignes. Tu redonnes de l’énergie au moment où ils en ont le plus besoin.',
	},
]

const rewards = [
	{
		title: 'Une inscription offerte',
		description:
		'Choisis ta course Overbound (ou offre-la à un proche). Tu vis l’expérience volontaire avant de te lancer à ton tour.',
	},
	{
		title: 'Kit volontaire',
		description:
		'Tenue technique, repas, boissons, accès coulisses… Tu es traité comme un membre essentiel de la tribu.',
	},
	{
		title: 'Souvenirs inoubliables',
		description:
		'Une immersion totale, des rencontres qui marquent, et la fierté d’avoir aidé des centaines d’athlètes à se dépasser.',
	},
]

const volunteerJourney = [
	{
		time: '08h00',
		title: 'Accueil & briefing tribu',
		description: 'On t’équipe, on partage les missions du jour et on se motive tous ensemble avant le départ.',
		icon: Users,
	},
	{
		time: '09h30',
		title: 'Action sur le terrain',
		description:
		'Tu accompagnes les coureurs sur ta zone, tu encourages, tu assures la sécurité et tu vibres avec eux à chaque obstacle.',
		icon: Clock,
	},
	{
		time: '18h00',
		title: 'Célébration & after',
		description:
		'Débrief tribu, remerciements officiels, goodies exclusifs et un grand moment de fierté collective.',
		icon: CheckCircle2,
	},
]

const applicationSteps = [
  {
    title: 'Choisis ton événement',
    description: 'Sélectionne un Overbound à venir ou indique celui que tu vises.',
    icon: CalendarDays,
  },
  {
    title: 'Précise ta mission',
    description: 'Obstacles, village, finish line... on te positionne selon ton envie et ta dispo.',
    icon: ShieldCheck,
  },
  {
    title: 'Reçois ton brief',
    description: 'La tribu te contacte sous 48 h avec ton horaire et toutes les infos logistiques.',
    icon: Users,
  },
]

const availabilityOptions = [
  { value: 'full_day', label: 'Journée complète (brief 07h30 → 19h00)' },
//   { value: 'morning', label: 'Matin — Brief, montage et premiers départs' },
//   { value: 'afternoon', label: 'Après-midi — Obstacles & finish line' },
//   { value: 'evening', label: 'Fin de journée — Derniers départs & démontage' },
  { value: 'flexible', label: 'Flexible — assigne-moi là où il y a besoin' },
]

const missionTitles = missions.map((mission) => mission.title)

const initialFormState = {
  fullName: '',
  email: '',
  phone: '',
  eventSelection: '',
  customEventName: '',
  availability: availabilityOptions[0]?.value ?? 'full_day',
  mission: 'Je laisse l’équipe décider',
  experience: '',
  motivations: '',
  gdprConsent: false,
}

type VolunteerFormState = typeof initialFormState

interface EventOption {
  id: string
  title: string
  date: string | null
  location: string | null
  status?: string | null
}

export default function VolunteersPage() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const isAuthenticated = Boolean(session?.user)
  const [events, setEvents] = useState<EventOption[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<VolunteerFormState>(initialFormState)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const availabilityLabels = useMemo(() => {
    const map = new Map<string, string>()
    availabilityOptions.forEach((option) => map.set(option.value, option.label))
    return map
  }, [])

  useEffect(() => {
    let active = true

    if (sessionLoading) {
      return () => {
        active = false
      }
    }

    if (!isAuthenticated) {
      setEvents([])
      setEventsError(null)
      setEventsLoading(false)
      return () => {
        active = false
      }
    }

    const loadEvents = async () => {
      setEventsLoading(true)
      setEventsError(null)

      try {
        const response = await fetch('/api/events', { method: 'GET' })
        if (!response.ok) {
          throw new Error('Impossible de charger les événements.')
        }

        const payload = await response.json()
        if (!Array.isArray(payload)) {
          throw new Error('Réponse inattendue du serveur.')
        }

        const now = Date.now()
        const threshold = now - 3 * 24 * 60 * 60 * 1000

        const normalized = payload
          .map((entry: any) => {
            if (!entry || !entry.id) return null
            const rawDate = typeof entry.date === 'string' ? entry.date : null
            return {
              id: String(entry.id),
              title: typeof entry.title === 'string' ? entry.title : 'Événement Overbound',
              date: rawDate,
              location: typeof entry.location === 'string' ? entry.location : null,
              status: typeof entry.status === 'string' ? entry.status : null,
            } as EventOption
          })
          .filter(Boolean) as EventOption[]

        const filtered = normalized.filter((event) => {
          if (!event.date) return true
          const time = Date.parse(event.date)
          if (Number.isNaN(time)) {
            return true
          }
          return time >= threshold
        })

        filtered.sort((a, b) => {
          const timeA = a.date ? Date.parse(a.date) : Number.POSITIVE_INFINITY
          const timeB = b.date ? Date.parse(b.date) : Number.POSITIVE_INFINITY
          return timeA - timeB
        })

        if (active) {
          setEvents(filtered)
        }
      } catch (error: any) {
        console.error('[volunteers page] events fetch failed', error)
        if (active) {
          setEventsError(
            error?.message ??
              "Impossible de récupérer les événements. Indique ton choix dans le champ libre.",
          )
        }
      } finally {
        if (active) {
          setEventsLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      active = false
    }
  }, [sessionLoading, isAuthenticated])

  const clearFieldError = (field: string) => {
    setFieldErrors((previous) => {
      if (!(field in previous)) {
        return previous
      }
      const { [field]: _removed, ...rest } = previous
      return rest
    })
  }

  const updateFormValue = <Key extends keyof VolunteerFormState>(field: Key, value: VolunteerFormState[Key]) => {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }))
    clearFieldError(field as string)
    if (submitError) {
      setSubmitError(null)
    }
    if (submitSuccess) {
      setSubmitSuccess(false)
    }
  }

  useEffect(() => {
    if (!session?.user) {
      return
    }

    setFormValues((previous) => {
      const suggestedName =
        previous.fullName ||
        session.profile?.full_name ||
        session.user?.user_metadata?.full_name ||
        ''
      const suggestedEmail = previous.email || session.user?.email || ''

      if (suggestedName === previous.fullName && suggestedEmail === previous.email) {
        return previous
      }

      return {
        ...previous,
        fullName: suggestedName,
        email: suggestedEmail,
      }
    })
  }, [session])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) {
      return
    }

    if (!isAuthenticated) {
      setSubmitError('Connecte-toi à ton compte pour remplir ce formulaire.')
      return
    }

    const errors: Record<string, string> = {}
    const trimmedName = formValues.fullName.trim()
    const trimmedEmail = formValues.email.trim()
    const trimmedPhone = formValues.phone.trim()
    const trimmedExperience = formValues.experience.trim()
    const trimmedMotivations = formValues.motivations.trim()
    const trimmedCustomEvent = formValues.customEventName.trim()

    if (trimmedName.length < 2) {
      errors.fullName = 'Indique ton prénom et ton nom.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Renseigne une adresse email valide.'
    }

    if (trimmedPhone && trimmedPhone.replace(/\D/g, '').length < 6) {
      errors.phone = 'Le téléphone doit contenir au moins 6 chiffres.'
    }

    let eventId: string | undefined
    let eventName: string | undefined

	switch (formValues.eventSelection) {
		case 'custom':
			if (trimmedCustomEvent.length < 3) {
				errors.customEventName = 'Précise le nom de l’événement.'
			} else {
				eventName = trimmedCustomEvent
			}
			break;
		case 'any':
			eventName = 'Disponible pour plusieurs événements'
			break;
		default:
			if (!formValues.eventSelection) {
				errors.eventSelection = 'Choisis un événement ou précise-le à l’équipe.'
			} else {
			 	eventId = formValues.eventSelection
				const selectedEvent = events.find((item) => item.id === eventId)
				if (selectedEvent?.title) {
					eventName = selectedEvent.title
				}
			}
			break;
	}

    const availabilityLabel = availabilityLabels.get(formValues.availability) ?? formValues.availability
    if (!availabilityLabel) {
      errors.availability = 'Sélectionne tes disponibilités.'
    }

    if (!formValues.mission) {
      errors.mission = 'Choisis la mission qui t’inspire le plus.'
    }

    if (!formValues.gdprConsent) {
      errors.gdprConsent = 'Nous avons besoin de ton accord pour te contacter.'
    }

	if (!formValues.phone.trim()) {
		errors.phone = 'Renseigne ton numéro de téléphone.'
	}

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/volunteers/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || undefined,
          eventId,
          eventName,
          availability: availabilityLabel,
          mission: formValues.mission,
          experience: trimmedExperience || undefined,
          motivations: trimmedMotivations || undefined,
          gdprConsent: formValues.gdprConsent,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        const message =
          result?.error ??
          "Impossible d’enregistrer ta candidature. Réessaie dans quelques minutes ou contacte-nous directement."
        setSubmitError(message)
        return
      }

      setSubmitSuccess(true)
      setFieldErrors({})
      setFormValues({
        ...initialFormState,
      })
    } catch (error) {
      console.error('[volunteers page] application submit failed', error)
      setSubmitError("Impossible d’enregistrer ta candidature. Réessaie dans quelques minutes ou contacte-nous.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEventSelectionChange = (value: string) => {
    updateFormValue('eventSelection', value)
    if (value !== 'custom') {
      updateFormValue('customEventName', '')
    }
  }

  return (
    <main className='relative min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground'>
		<section className='relative isolate overflow-hidden py-20 sm:py-24'>
			<div className='absolute inset-0'>
				<div
					className='h-full w-full bg-cover bg-center'
					style={{
						backgroundImage:
							"url('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1400&auto=format&fit=crop')",
					}}
				/>
				<div className='absolute inset-0 bg-background/55 backdrop-blur-[3px]' />
				<div className='absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background' />
			</div>

			<div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-3xl space-y-6 text-center lg:text-left'>
					<span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
						Volontaires Overbound
					</span>
					<h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
						Fais vibrer la course, rejoins la tribu.
					</h1>
					<p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
						Être volontaire, c’est vivre l’expérience Overbound de l’intérieur, donner du courage au moment où les
						coureurs doutent et repartir avec des souvenirs qui restent toute une vie. Tu ne guettes pas le podium,
						tu crées l’émotion.
					</p>
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
						<Button asChild size='lg' className='h-12 w-full bg-primary text-white hover:bg-primary/90 sm:w-auto'>
							<Link href='#rejoindre'>Je postule comme bénévole</Link>
						</Button>
						<Button
							asChild
							variant='outline'
							size='lg'
							className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
						>
							<Link href='/events'>Voir les événements</Link>
						</Button>
					</div>
				</div>

			</div>
		</section>

		<section className='mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8'>
			<Headings
			title='Pourquoi on a besoin de toi'
			description='Tu ne tiens pas un stand. Tu rends possible chaque sourire, chaque dépassement. Tu es l’âme d’Overbound.'
			/>

			<div className='grid gap-6 md:grid-cols-3'>
			{missions.map((mission) => (
				<Card key={mission.title} className='border border-primary/20 bg-primary/5 shadow-lg shadow-primary/10'>
					<CardHeader>
						<CardTitle className='text-xl text-primary'>{mission.title}</CardTitle>
					</CardHeader>
					<CardContent className='text-sm leading-relaxed text-primary/80'>{mission.description}</CardContent>
				</Card>
			))}
			</div>
		</section>

		<section className='relative bg-accent-foreground'>
			<Image
				src='/images/mountain-vector.svg'
				alt='Décor montagne'
				width={1600}
				height={800}
				className='w-screen rotate-180 absolute top-[-2%]'
				priority
			/>

			<div className='mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8 sm:pb-20 md:pb-30 pt-50'>
				<SubHeadings
					title='Ils ont donné de leur temps, ils ont gagné une tribu'
					description='Les volontaires Overbound parlent d’amitié, de fierté, de frissons. Pas de “bénévolat”, mais d’expérience de vie.'
					sx='text-black'
				/>
				<div className='grid gap-6 md:grid-cols-3'>
					{testimonials.map((testimonal) => (
						<Card key={testimonal.name} className='border border-primary/20 bg-background/90 shadow-lg shadow-primary/10'>
							<CardContent className='space-y-4 p-6 text-sm leading-relaxed text-muted-foreground'>
							<p className='italic'>&ldquo;{testimonal.quote}&rdquo;</p>
							<p className='text-sm font-semibold text-primary'>{testimonal.name}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>

		<section className='relative flex items-center justify-center overflow-hidden bg-accent-foreground pb-50'>
			<div className='volunteer-wave-container relative z-10 flex w-full max-w-7xl flex-col gap-12 overflow-hidden rounded-2xl border border-primary/30 bg-primary/20 px-30 sm:py-20 md:py-30'>
				<SubHeadings
					title='Ce que tu reçois en retour'
					description='Pour chaque heure donnée, tu repars avec de la gratitude, un dossard offert et une famille.'
					sx='relative z-10 text-black'
				/>

				<div className='relative z-10 grid gap-6 md:grid-cols-3'>
					{rewards.map((reward) => (
						<Card key={reward.title} className='border border-border/60 bg-background/90 shadow-lg shadow-primary/5'>
							<CardHeader>
							<CardTitle className='text-xl text-foreground'>{reward.title}</CardTitle>
							</CardHeader>
							<CardContent className='text-sm leading-relaxed text-muted-foreground'>{reward.description}</CardContent>
						</Card>
					))}
				</div>
			</div>
			<Image
				src='/images/mountain-vector.svg'
				alt='Décor montagne'
				width={1600}
				height={800}
				className='w-screen absolute bottom-[-2%]'
				priority
			/>
		</section>

		<section
			id='rejoindre'
			className='relative overflow-hidden bg-muted/40 py-20 sm:py-24'
		>
			<div className='relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-16'>
				<div className='w-2/5 space-y-6'>
					<SubHeadings
						title='Postule en 3 minutes'
						description='Choisis ton événement, ta mission, et on te briefe sous 48 h avec tous les détails.'
					/>
					<div className='grid gap-4'>
						{applicationSteps.map(({ title, description, icon: Icon }) => (
							<div
								key={title}
								className='flex items-start gap-3 rounded-2xl border border-primary/20 bg-background/90 p-4 shadow-sm shadow-primary/10'
							>
								<span className='mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<Icon className='h-5 w-5' />
								</span>
								<div>
									<p className='text-base font-semibold text-foreground'>{title}</p>
									<p className='text-sm text-muted-foreground'>{description}</p>
								</div>
							</div>
						))}
					</div>
					<p className='text-sm text-muted-foreground'>
						Le kit bénévole inclut tenue technique, repas, boissons et une place offerte pour courir à ton tour
						sur la saison.
					</p>
				</div>

				<Card className='flex-1 border border-primary/30 bg-background/95 shadow-xl shadow-primary/10 backdrop-blur-sm'>
					<CardHeader className='space-y-2'>
						<CardTitle className='text-2xl font-semibold text-primary sm:text-3xl'>
							Inscris-toi comme bénévole
						</CardTitle>
						<p className='text-sm text-muted-foreground'>
							Connecte-toi, renseigne tes disponibilités et on te positionne sur la mission idéale.
						</p>
					</CardHeader>
					<CardContent className='space-y-6'>
						{sessionLoading ? (
							<div className='flex h-40 items-center justify-center text-muted-foreground'>
								<Loader2 className='h-6 w-6 animate-spin' />
							</div>
						) : !isAuthenticated ? (
							<div className='flex flex-col items-center gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center'>
								<span className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<LogIn className='h-6 w-6' />
								</span>
								<div className='space-y-2'>
									<p className='text-lg font-semibold text-foreground'>Connecte-toi pour postuler</p>
									<p className='text-sm text-muted-foreground'>
										Crée ton compte Overbound ou connecte-toi pour accéder au formulaire et recevoir ton brief personnalisé.
									</p>
								</div>
								<div className='flex w-full flex-col gap-3 sm:flex-row'>
									<Button onClick={() => window.location.href = '/auth/login?next=/volunteers'} className='h-11 flex-1'>
										Se connecter
									</Button>
									<Button
										variant='outline'
										onClick={() => window.location.href = '/auth/register?next=/volunteers'}
										className='h-11 flex-1 border-primary text-primary hover:bg-primary/10'
									>
										S'inscrire
									</Button>
								</div>
							</div>
						) : (
							<>
								{submitSuccess ? (
									<Alert className='border-primary/40 bg-primary/10'>
										<AlertTitle>Merci !</AlertTitle>
										<AlertDescription>
											Ta candidature est bien envoyée. L’équipe tribu te contacte très vite pour te briefer.
										</AlertDescription>
									</Alert>
								) : null}

								{submitError ? (
									<Alert variant='destructive'>
										<AlertTitle>Oups</AlertTitle>
										<AlertDescription>{submitError}</AlertDescription>
									</Alert>
								) : null}

								<form className='space-y-6' onSubmit={handleSubmit} noValidate>
									<div className='grid gap-4 md:grid-cols-2'>
										<div className='space-y-2'>
											<Label htmlFor='fullName'>Nom complet</Label>
											<Input
												id='fullName'
												placeholder='Anaïs Dupont'
												value={formValues.fullName}
												onChange={(event) => updateFormValue('fullName', event.target.value)}
												autoComplete='name'
												aria-invalid={Boolean(fieldErrors.fullName)}
												className='h-12'
											/>
											{fieldErrors.fullName ? (
												<p className='text-xs text-destructive'>{fieldErrors.fullName}</p>
											) : null}
										</div>
										<div className='space-y-2'>
											<Label htmlFor='email'>Email</Label>
											<Input
												id='email'
												type='email'
												placeholder='prenom@exemple.com'
												value={formValues.email}
												onChange={(event) => updateFormValue('email', event.target.value)}
												autoComplete='email'
												aria-invalid={Boolean(fieldErrors.email)}
												className='h-12'
											/>
											{fieldErrors.email ? (
												<p className='text-xs text-destructive'>{fieldErrors.email}</p>
											) : null}
										</div>
									</div>

									<div className='grid gap-4 md:grid-cols-2'>
										<div className='space-y-2'>
											<Label htmlFor='phone'>Téléphone portable</Label>
											<Input
												id='phone'
												type='tel'
												placeholder='06 12 34 56 78'
												value={formValues.phone}
												onChange={(event) => updateFormValue('phone', event.target.value)}
												autoComplete='tel'
												aria-invalid={Boolean(fieldErrors.phone)}
												className='h-12'
											/>
											{fieldErrors.phone ? (
												<p className='text-xs text-destructive'>{fieldErrors.phone}</p>
											) : null}
										</div>
										<div className='space-y-2 w-full h-full '>
											<Label htmlFor='availability'>Tes disponibilités</Label>
											<Select
												value={formValues.availability}
												onValueChange={(value) => updateFormValue('availability', value)}
											>
												<SelectTrigger
													id='availability'
													className={cn(
														'h-full w-full',
														fieldErrors.availability &&
															'border-destructive focus-visible:ring-destructive/40',
													)}
												>
													<SelectValue placeholder='Choisis ton créneau' />
												</SelectTrigger>
												<SelectContent>
													{availabilityOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{fieldErrors.availability ? (
												<p className='text-xs text-destructive'>{fieldErrors.availability}</p>
											) : null}
										</div>
									</div>

									<div className='grid gap-4 md:grid-cols-2 w-full'>
										<div className='space-y-2 w-full'>
											<Label htmlFor='event-selection'>Événement souhaité</Label>
											<Select
												value={formValues.eventSelection || undefined}
												onValueChange={handleEventSelectionChange}
											>
												<SelectTrigger
													id='event-selection'
													disabled={eventsLoading && events.length === 0}
													className={cn(
														'h-12 w-full',
														fieldErrors.eventSelection &&
															'border-destructive focus-visible:ring-destructive/40',
													)}
												>
													<SelectValue
														placeholder={
															eventsLoading ? 'Chargement des événements...' : 'Sélectionne ton événement'
														}
													/>
												</SelectTrigger>
												<SelectContent
													className='max-h-60 overflow-y-auto'
												>
													{events.map((eventOption) => {
														const eventDate =
															eventOption.date && !Number.isNaN(Date.parse(eventOption.date))
																? new Date(eventOption.date).toLocaleDateString('fr-FR', {
																		day: 'numeric',
																		month: 'long',
																		year: 'numeric',
																	})
																: null
														const labelParts = [eventOption.title, eventDate, eventOption.location].filter(
															Boolean,
														)
														return (
															<SelectItem key={eventOption.id} value={eventOption.id}>
																{labelParts.join(' · ')}
															</SelectItem>
														)
													})}
													<SelectItem value='any'>Je peux aider sur plusieurs événements</SelectItem>
													<SelectItem value='custom'>Mon événement n’est pas dans la liste</SelectItem>
												</SelectContent>
											</Select>
											{eventsError ? (
												<p className='text-xs text-muted-foreground'>{eventsError}</p>
											) : null}
											{fieldErrors.eventSelection ? (
												<p className='text-xs text-destructive'>{fieldErrors.eventSelection}</p>
											) : null}
										</div>

										<div className='space-y-2 w-full'>
											<Label htmlFor='mission'>Mission qui t’inspire</Label>
											<Select
												value={formValues.mission}
												onValueChange={(value) => updateFormValue('mission', value)}
											>
												<SelectTrigger
													id='mission'
													className={cn(
														'h-12 w-full',
														fieldErrors.mission && 'border-destructive focus-visible:ring-destructive/40',
													)}
												>
													<SelectValue placeholder='Choisis ta mission' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='Je laisse l’équipe décider'>
														Laissez l’équipe me positionner
													</SelectItem>
													{missionTitles.map((title) => (
														<SelectItem key={title} value={title}>
															{title}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{fieldErrors.mission ? (
												<p className='text-xs text-destructive'>{fieldErrors.mission}</p>
											) : null}
										</div>

										{formValues.eventSelection === 'custom' ? (
											<div className='space-y-2'>
												<Label htmlFor='custom-event'>Précise le nom de l’événement</Label>
												<Input
													id='custom-event'
													placeholder='Overbound Lyon – 12 mai'
													value={formValues.customEventName}
													onChange={(event) => updateFormValue('customEventName', event.target.value)}
													aria-invalid={Boolean(fieldErrors.customEventName)}
													className='h-12'
												/>
												{fieldErrors.customEventName ? (
													<p className='text-xs text-destructive'>{fieldErrors.customEventName}</p>
												) : null}
											</div>
										) : null}
									</div>

									<div className='space-y-2'>
										<Label htmlFor='experience'>Ton expérience bénévole (optionnel)</Label>
										<Textarea
											id='experience'
											placeholder='Tu as déjà aidé sur des courses, des événements sportifs, ou tu veux te lancer ?'
											value={formValues.experience}
											onChange={(event) => updateFormValue('experience', event.target.value)}
											rows={4}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='motivations'>Un mot pour la tribu (optionnel)</Label>
										<Textarea
											id='motivations'
											placeholder='Partage-nous tes motivations, contraintes horaires, amis à positionner avec toi...'
											value={formValues.motivations}
											onChange={(event) => updateFormValue('motivations', event.target.value)}
											rows={4}
										/>
									</div>

									<div className='space-y-3'>
										<div className='flex items-start gap-3 rounded-lg bg-muted/30 p-4'>
											<Checkbox
												id='gdprConsent'
												checked={formValues.gdprConsent}
												onCheckedChange={(checked) => updateFormValue('gdprConsent', checked === true)}
												aria-invalid={Boolean(fieldErrors.gdprConsent)}
												className='mt-1'
											/>
											<Label htmlFor='gdprConsent' className='text-sm leading-relaxed text-muted-foreground'>
												J’accepte que Overbound me contacte au sujet de la mission bénévole sélectionnée et des
												informations logistiques associées.
											</Label>
										</div>
										{fieldErrors.gdprConsent ? (
											<p className='text-xs text-destructive'>{fieldErrors.gdprConsent}</p>
										) : null}
									</div>

									<Button type='submit' className='h-12 w-full text-base font-semibold' disabled={submitting}>
										{submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
										Envoyer ma candidature bénévole
									</Button>
								</form>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</section>

		<VolunteerFAQSection />

		{/* <section className='bg-background py-20 sm:py-24'>
			<div className='mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8'>
			<div className='text-center sm:text-left'>
				<p className='text-xs uppercase tracking-[0.5em] text-primary'>Ton aventure</p>
				<h2 className='mt-3 text-3xl font-semibold sm:text-4xl'>Une journée avec la tribu volontaire</h2>
				<p className='mt-3 text-base text-muted-foreground sm:max-w-2xl'>
				De l’instant où tu arrives sur le site jusqu’à la célébration finale, chaque moment compte. Voici comment
				se vit l’engagement Overbound côté coulisses.
				</p>
			</div>
			<div className='grid gap-6 md:grid-cols-3'>
				{volunteerJourney.map(({ time, title, description, icon: Icon }) => (
				<Card key={title} className='h-full border border-border/60 bg-background/90 shadow-lg shadow-primary/10'>
					<CardHeader className='space-y-3'>
					<div className='flex items-center gap-3'>
						<span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
						<Icon className='h-6 w-6' />
						</span>
						<div>
						<p className='text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground'>{time}</p>
						<CardTitle className='text-lg text-foreground'>{title}</CardTitle>
						</div>
					</div>
					</CardHeader>
					<CardContent>
					<p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>
					</CardContent>
				</Card>
				))}
			</div>
			</div>
		</section> */}
    </main>
  )
}
