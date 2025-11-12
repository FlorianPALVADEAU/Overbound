import React from 'react'
import Headings from '../globals/Headings'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import Image from 'next/image'
import { Button } from '../ui/button'
import Link from 'next/link'
import AnimatedBanner from './AnimatedBanner'
import { UtensilsCrossed, Gift, Ticket, Users, Heart, ArrowRight } from 'lucide-react'
import SubHeadings from '../globals/SubHeadings'

const VolunteersAppeal = () => {
  return (
    <section className='w-full min-h-screen flex flex-col justify-between items-center relative overflow-hidden bg-gradient-to-b from-neutral-900 to-black'>
        {/* Effet de fond avec motifs */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(38,170,38,0.1),transparent_40%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(38,170,38,0.08),transparent_40%)]'></div>

        <AnimatedBanner title="Volontaires" />

        <div className='relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24'>
            {/* En-tête de section */}
            <div className='text-center mb-12 sm:mb-16'>
                <Headings
                    title="Deviens volontaire, vis l'aventure autrement"
                    description="Parce que sans guerriers de l'ombre, il n'y a pas de légende. Rejoins l'équipe qui fait vivre la tribu."
                />
            </div>

            {/* Texte d'introduction */}
            <Card className='mb-16 border-2 border-primary/20 bg-gradient-to-br from-neutral-800 to-neutral-900 shadow-2xl hover:shadow-primary/10 transition-all'>
                <CardContent className='p-6 sm:p-8 space-y-4 text-neutral-200 text-base sm:text-lg leading-relaxed'>
                    <p>
                        Overbound ne serait rien sans ses volontaires.
                        Être volontaire, <span className='text-primary font-semibold'>ce n'est pas "aider dans l'ombre"</span>, c'est être au cœur de l'action.
                    </p>
                    <p>
                        Tu vibres avec les coureurs, tu crées l'ambiance, tu partages des moments intenses avec l'équipe et tu fais partie intégrante de la tribu.
                        C'est une aventure humaine unique : <span className='text-primary font-semibold'>de l'adrénaline, des rencontres, de la fierté</span>… un souvenir aussi marquant que pour les participants.
                    </p>
                </CardContent>
            </Card>

            {/* Grid des avantages */}
            <div className='mb-12 sm:mb-16'>
                <SubHeadings 
                    title="Les avantages à être volontaire"
                    sx='mb-4'
                />
                <div className='grid gap-6 md:grid-cols-3'>
                    {/* Avantage 1 */}
                    <Card className='group border-2 border-neutral-700 bg-neutral-800/50 hover:border-primary/40 hover:-translate-y-1 transition-all'>
                        <CardHeader className='space-y-4'>
                            <div className='rounded-2xl bg-primary/10 p-4 w-fit'>
                                <UtensilsCrossed className='h-8 w-8 text-primary' />
                            </div>
                            <CardTitle className='text-xl text-white'>Repas offert</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-neutral-300 leading-relaxed'>
                                Un repas gratuit pour garder ton énergie toute la journée et partager un moment convivial avec l'équipe.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Avantage 2 */}
                    <Card className='group border-2 border-neutral-700 bg-neutral-800/50 hover:border-primary/40 hover:-translate-y-1 transition-all'>
                        <CardHeader className='space-y-4'>
                            <div className='rounded-2xl bg-primary/10 p-4 w-fit'>
                                <Gift className='h-8 w-8 text-primary' />
                            </div>
                            <CardTitle className='text-xl text-white'>Pack volontaire</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-neutral-300 leading-relaxed'>
                                Un pack exclusif rempli de surprises, cadeaux et goodies officiels Overbound à collectionner.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Avantage 3 */}
                    <Card className='group border-2 border-primary/40 bg-gradient-to-br from-neutral-800 to-primary/5 hover:border-primary/60 hover:-translate-y-1 transition-all'>
                        <CardHeader className='space-y-4'>
                            <div className='rounded-2xl bg-primary/20 p-4 w-fit'>
                                <Ticket className='h-8 w-8 text-primary' />
                            </div>
                            <CardTitle className='text-xl text-white flex items-center gap-2'>
                                1 place offerte
                                <Badge className='bg-primary text-white font-bold'>Gratuit</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-neutral-300 leading-relaxed'>
                                <span className='text-primary font-semibold'>75% de réduction</span> sur ta prochaine course Overbound. Passe de volontaire à participant !
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Section CTA finale */}
            <div className='relative'>
                <Card className='border-2 border-primary/30 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black overflow-hidden'>
                    <div className='absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl'></div>
                    <div className='absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl'></div>

                    <CardContent className='relative z-10 p-8 sm:p-12 lg:p-16'>
                        <div className='grid gap-8 lg:grid-cols-2 items-center'>
                            {/* Colonne gauche : texte + CTA */}
                            <div className='space-y-6'>
                                <div className='flex items-center gap-3'>
                                    <Users className='h-8 w-8 text-primary' />
                                    <Badge className='bg-primary/20 text-primary border-primary/40 text-sm font-semibold px-3 py-1'>
                                        250+ volontaires actifs
                                    </Badge>
                                </div>
                                <h3 className='text-3xl sm:text-4xl font-bold text-white'>
                                    Prêt à rejoindre la tribu ?
                                </h3>
                                <p className='text-neutral-300 text-lg leading-relaxed'>
                                    Deviens un acteur essentiel des événements Overbound. Inscris-toi dès maintenant et découvre une expérience unique.
                                </p>
                                <Button
                                    asChild
                                    size='lg'
                                    className='w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transform transition-all'
                                >
                                    <Link href='/volunteer'>
                                        Je deviens volontaire
                                        <ArrowRight className='ml-2 h-5 w-5' />
                                    </Link>
                                </Button>
                            </div>

                            {/* Colonne droite : image */}
                            <Image
                                src="/images/hero_header_poster.jpg"
                                alt="Volontaires Overbound"
                                width={600}
                                height={400}
                                className="w-full h-64 sm:h-80 lg:h-96 rounded-xl object-cover"
                                priority
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <AnimatedBanner title="Volontaires" />
    </section>
  )
}

export default VolunteersAppeal