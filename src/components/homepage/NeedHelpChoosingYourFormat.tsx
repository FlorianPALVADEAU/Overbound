import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'

const NeedHelpChoosingYourFormat = () => {
  return (
        <div className='rounded-2xl border border-border/60 bg-background/80 p-6'>
            <div className='flex flex-col gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left'>
            <div className='space-y-2'>
                <h3 className='text-xl font-semibold text-foreground'>Besoin d’un coup de pouce pour choisir&nbsp;?</h3>
                <p className='text-sm text-muted-foreground'>
                    Utilise notre questionnaire ou contacte la tribu pour une recommandation personnalisée.
                </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
                <Button asChild size='lg' className='h-12 rounded-full bg-primary text-white hover:bg-primary/90'>
                    <Link href='/trainings/what-race-for-me'>Choisir mon format</Link>
                </Button> 
            </div>
            </div>
        </div>
  )
}

export default NeedHelpChoosingYourFormat