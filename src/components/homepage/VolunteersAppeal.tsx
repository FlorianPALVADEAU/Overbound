import React from 'react'
import Headings from '../globals/Headings'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import Link from 'next/link'
import Image from 'next/image'
import AnimatedBanner from './AnimatedBanner'
import { UtensilsCrossed, Gift, Ticket, ArrowRight } from 'lucide-react'
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
            <Card className='mb-16 border-2 bg-transparent shadow-2xl hover:shadow-primary/10 transition-all'>
                <CardContent className='p-6 sm:p-8 space-y-4 text-neutral-200 text-base sm:text-lg leading-relaxed'>
                    <p>
                        Parce que le coeur de notre tribu bat grâce à l'engagement de ses membres, nous sommes à la recherche de volontaires passionnés pour nous aider à faire de chaque événement Overbound une expérience inoubliable.
                    </p>
                    <p>
                        En tant que volontaire, tu seras au premier plan de l'action. Que tu sois un vétéran des courses d'obstacles ou un passionné amateur, ton énergie et ton enthousiasme seront des atouts précieux pour notre équipe.
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

                    {/* Avantage 2 */}
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

                    {/* Avantage 3 */}
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

                </div>
            </div>

            {/* Section CTA finale (compact) */}
            <div className='relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-neutral-900/60 shadow-2xl shadow-primary/10'>
                {/* decor */}
                
                <div className='relative grid items-center gap-8 lg:grid-cols-2 h-[500px]'>
                    {/* Image à gauche avec overlay */}
                        <Image
                            src="/images/hero_header_poster.jpg"
                            alt="Volontaires Overbound"
                            width={600}
                            height={400}
                            className="w-auto h-full rounded-xl object-cover"
                            priority
                        />

                    {/* Texte et CTA à droite */}
                    <div className='space-y-6'>
                        <Badge className='bg-primary text-white'>Inscription offerte</Badge>
                        <h3 className='text-3xl sm:text-4xl font-bold text-white'>
                            Prêt à rejoindre la tribu ?
                        </h3>
                        <p className='text-neutral-300 text-lg'>
                            Inscris-toi en 3 minutes et vis l’aventure de l’intérieur.
                        </p>

                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                            <Button
                                asChild
                                size='lg'
                                className='h-12 w-full bg-primary text-white hover:bg-primary/90 sm:w-auto'
                            >
                                <Link href='/volunteers#rejoindre'>
                                    Je deviens volontaire
                                    <ArrowRight className='ml-2 h-5 w-5' />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant='outline'
                                size='lg'
                                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
                            >
                                <Link href='/volunteers'>Découvrir le programme</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <AnimatedBanner title="Volontaires" />
    </section>
  )
}

export default VolunteersAppeal
