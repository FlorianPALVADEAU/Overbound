/* eslint-disable @next/next/no-img-element */
import React, { useEffect } from 'react'
import { Button } from '../ui/button'
import Headings from '../globals/Headings'
import Link from 'next/link'
import { useGetEvents } from '@/app/api/events/eventsQueries'
import { Skeleton } from '../ui/skeleton'

const NextEvents = () => {
	
	const { data, isLoading, isError } = useGetEvents()

	return (
		<div className='w-full min-h-[60vh] xl:h-[80vh] py-12 sm:py-16 xl:py-20 px-4 sm:px-6 xl:px-32 relative overflow-hidden'>
			<div className='flex flex-col gap-8 sm:gap-10 xl:gap-12 h-full'>
				<Headings 
					title="Parce qu'il n'y a qu'une seule première fois."
					description="Découvre l'expérience Overbound et deviens l'un des premiers à rejoindre l'aventure."
				/>
				
				<div className='flex flex-col gap-6 xl:gap-6 flex-1'>
					<h3 className='text-xl sm:text-2xl font-bold'>Les prochains événements</h3>
					<div className='flex flex-col xl:flex-row xl:items-center gap-6 sm:gap-8 xl:gap-12 flex-1'>
						{
							isLoading ? (
								<Skeleton className="object-cover w-full xl:w-4/6 h-48 sm:h-64 md:h-72 xl:h-[50vh] rounded-lg shadow-lg" />
							) : isError ? (
								<img 
									src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
									alt="Événement Overbound"
									className="object-cover w-full h-48 sm:h-64 md:h-72 xl:h-[50vh] rounded-lg shadow-lg"
								/>
							) : (
								<div className='w-full xl:w-4/6 flex-shrink-0'>
									{data && data.length > 0 && (
										<Link 
											href={`/events/${data[0].id}`}
										>
											<img 
												src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
												alt={data && data.length > 0 ? data[0].title : "Événement Overbound"}
												className="object-cover w-full h-48 sm:h-64 md:h-72 xl:h-[50vh] rounded-lg shadow-lg"
											/>
										</Link>
									)}
								</div>
							)
						}

						<div className='w-full xl:w-2/6 flex flex-col gap-6 xl:gap-4 xl:h-full xl:justify-between'>
							<div className='flex flex-col gap-3 xl:gap-2'>
								<p className='text-base sm:text-lg xl:text-lg text-justify text-gray-300 leading-relaxed'>
									Le 12 octobre 2025, la première édition d'Overbound prendra vie à Plaisir.
								</p>
								<p className='text-base sm:text-lg xl:text-lg text-justify text-gray-300 leading-relaxed'>
									Un parcours sauvage de 6 & 12 km, sculpté par la nature, où l'eau glacée, la boue et les obstacles inédits mettront à l'épreuve ta force et ton mental.
								</p>
								<p className='text-base sm:text-lg xl:text-lg text-justify text-gray-300 leading-relaxed'>
									Pas de décors artificiels, pas de compromis : juste toi, les éléments, et la tribu .
								</p>
								<p className='text-base sm:text-lg xl:text-lg text-justify text-white font-medium leading-relaxed'>
									Es-tu prêt à écrire l'histoire avec nous ?
								</p>
							</div>
							
							<div className='pt-2 xl:pt-0'>
								<Link href="/events">
									<Button 
									variant={'default'} 
									className="
										w-full 
										sm:w-64 xl:w-64 
										h-12 sm:h-14 xl:h-14 
										text-base sm:text-lg xl:text-md 
										font-semibold
										transition-all duration-300
										hover:scale-105
										shadow-lg hover:shadow-xl
									"
									>
										Je réserve ma place
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NextEvents