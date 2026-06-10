import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'

const NeedHelpChoosingYourFormat = () => {
  return (
        <div className='relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 sm:p-10'>
            <div className='pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl' />
            <div className='pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl' />
            <div className='relative flex flex-col gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left'>
            <div className='space-y-2'>
                <h3 className='text-xl font-semibold text-foreground sm:text-2xl'>Besoin d'un coup de pouce pour choisir&nbsp;?</h3>
                <p className='text-sm text-muted-foreground sm:text-base'>
                    Utilise notre questionnaire ou contacte la tribu pour une recommandation personnalisée.
                </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
                <Button asChild size='lg' className='h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90'>
                    <Link href='/trainings/what-race-for-me'>Choisir mon format</Link>
                </Button>
            </div>
            </div>
        </div>
  )
}

export default NeedHelpChoosingYourFormat