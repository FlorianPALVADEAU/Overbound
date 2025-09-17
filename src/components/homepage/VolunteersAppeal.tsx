import React from 'react'
import Headings from '../globals/Headings'
import SubHeadings from '../globals/SubHeadings'
import { Card } from '../ui/card'
import Image from 'next/image'
import { Button } from '../ui/button'

const VolunteerBanner = () => {
    return (
        <div className='py-[15px] lg:py-[30px] relative overflow-hidden bg-neutral-200 flex flex-row text-black'>
                {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className='shrink-0 flex items-center justify-around whitespace-nowrap w-fit animate-marquee'>
                        <p className='shrink-0 text-2xl text-uppercase my-0 mx-[125px] font-semibold'>
                            VOLONTAIRES
                        </p>
                    </div>
                ))}
            <style jsx>{`
                @keyframes marquee {
                    from {
                        left: translateX(0);
                    }
                    to {
                        transform: translateX(-100%);
                    }
                }

                .animate-marquee {
                    animation: marquee 5s linear infinite;
                }
            `}</style>
        </div>
    )
}

const VolunteersAppeal = () => {
  return (
    <section className='text-white w-full min-h-[screen] flex flex-col justify-between items-center relative overflow-hidden' style={{backgroundColor: '#141414'}}>
        {/* Effet de fond subtil avec le vert d'accent */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(38,170,38,0.08),transparent_50%)]'></div>
        
        <VolunteerBanner />
        
        <div className='relative z-10 w-full h-auto flex flex-col justify-start items-start gap-8 sm:gap-10 md:gap-12 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32'>
            <div className='w-full'>
                <Headings
                    title="Deviens volontaire, vis l'aventure autrement."
                    description="Parce que sans guerriers de l'ombre, il n'y a pas de légende."
                />
            </div>
            
            {/* Layout responsive : colonne sur mobile, ligne sur desktop */}
            <div className='w-full h-auto flex flex-col lg:flex-row justify-between items-start gap-8 md:gap-10 lg:gap-12 xl:gap-16'>
                
                {/* Section texte et avantages */}
                <div className='w-full lg:w-3/5 h-auto flex flex-col justify-start items-start gap-4 sm:gap-5 md:gap-6'>
                    <div className='text-gray-200 text-sm sm:text-base md:text-lg leading-relaxed space-y-4'>
                        <p>
                            Overbound ne serait rien sans ses volontaires.
                            Être volontaire, ce n'est pas "aider dans l'ombre", c'est être au coeur de l'action.
                        </p>
                        <p>
                            Tu vibres avec les coureurs, tu crées l'ambiance, tu partages des moments intenses avec l'équipe et tu fais partie intégrante de la tribu.
                            C'est une aventure humaine unique : de l'adrénaline, des rencontres, de la fierté… un souvenir aussi marquant que pour les participants.
                        </p>
                    </div>
                    
                    {/* Card des avantages */}
                    <Card className='w-full mt-4 sm:mt-6 p-4 sm:p-5 md:p-6 border-2 border-neutral-600 bg-neutral-800/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:border-[#26AA26]/50'>
                        <div className='space-y-3 sm:space-y-4'>
                            <SubHeadings
                                title="Les avantages exclusifs"
                                sx="text-[#26AA26]"
                            />
                            <p className='text-gray-200 text-sm sm:text-base'>En tant que volontaire, tu profites de :</p>
                            <ul className='list-none space-y-2 sm:space-y-3 text-sm sm:text-base'>
                                <li className='flex items-start gap-3'>
                                    <span className='text-[#26AA26] text-lg'>🍽️</span>
                                    <span className='text-gray-200'>Un repas gratuit pour garder ton énergie toute la journée</span>
                                </li>
                                <li className='flex items-start gap-3'>
                                    <span className='text-[#26AA26] text-lg'>🎁</span>
                                    <span className='text-gray-200'>Un pack volontaire rempli de surprises et de cadeaux</span>
                                </li>
                                <li className='flex items-start gap-3'>
                                    <span className='text-[#26AA26] text-lg'>💰</span>
                                    <span className='text-gray-200'>Une réduction de <strong className='text-[#26AA26]'>-75%</strong> sur ta prochaine course Overbound</span>
                                </li>
                            </ul>
                        </div>
                    </Card>
                </div>
                
                {/* Section image et CTA */}
                <div className='w-full lg:w-2/5 h-auto flex flex-col justify-start lg:justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 lg:px-6 xl:px-12'>
                    {/* Image avec effet */}
                    <div className='relative w-full max-w-sm lg:max-w-none group'>
                        <div className='absolute -inset-1 bg-gradient-to-r from-[#26AA26] to-[#1e8a1e] rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300'></div>
                        <div className='relative'>
                            <Image
                                src="/images/hero_header_poster.jpg"
                                alt="Volunteers"
                                width={400}
                                height={400}
                                className="w-full h-64 sm:h-72 md:h-80 lg:h-64 xl:h-80 rounded-lg object-cover shadow-2xl"
                                priority
                            />
                        </div>
                    </div>
                    
                    {/* CTA Button */}
                    <Button 
                        className='w-full max-w-sm lg:max-w-none h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-[#26AA26] to-[#1e8a1e] hover:from-[#1e8a1e] hover:to-[#166916] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0'
                        style={{color: '#ffffff'}}
                    >
                        Je deviens volontaire !
                    </Button>
                    
                    {/* Stats ou badge de confiance */}
                    <div className='hidden lg:flex flex-col items-center gap-2 text-center opacity-80'>
                        <p className='text-gray-400 text-sm'>Rejoins déjà</p>
                        <p className='text-2xl font-bold text-[#26AA26]'>250+</p>
                        <p className='text-gray-400 text-sm'>volontaires actifs</p>
                    </div>
                </div>
            </div>
        </div>

        <VolunteerBanner />
    </section>
  )
}

export default VolunteersAppeal