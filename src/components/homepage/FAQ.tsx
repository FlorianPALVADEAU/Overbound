'use client'
import React, { useState } from 'react'
import Headings from '../globals/Headings'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import { Skeleton } from '../ui/skeleton'
import { QuestionType } from '@/types/Question'
import { Button } from '../ui/button'
import { ArrowDown, Sparkles } from 'lucide-react'
import { v4 as uuid } from 'uuid';
import Link from 'next/link'

const FAQ = () => {
    const emptyQuestion = {id: '', title: '', answer: ''}
    const {data: questions, isLoading, isError} = useQuery({
        queryKey: ['faq'],
        queryFn: async (): Promise<QuestionType[]> => {
            const res = await client.fetch(FAQsQuery)
            return res as QuestionType[]
        }
    })

    const RenderQuestion = (question: QuestionType, loading: boolean, err: boolean) => {
        const [answerHidden, setAnswerHidden] = useState<boolean>(true);

        return (
            <div 
                className='group w-full h-auto flex justify-between items-start gap-3 p-6 border-2 border-neutral-700 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 rounded-2xl cursor-pointer transition-all duration-500 ease-in-out hover:shadow-2xl hover:shadow-[#26AA26]/20 hover:border-[#26AA26]/50 hover:bg-gradient-to-br hover:from-neutral-800/80 hover:to-neutral-900/80 backdrop-blur-sm'
                onClick={() => setAnswerHidden(!answerHidden)}
                key={question.id + uuid()}
            >
                    {loading || err ? (
                        <Skeleton className='w-full h-6 rounded-md bg-neutral-700' />
                    ) : (
                        <div className='w-9/10 flex flex-col gap-3'>
                            <div className='flex items-center gap-2'>
                                {/* <Sparkles className='h-5 w-5 text-[#26AA26] opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12' /> */}
                                <h3 
                                    className='text-lg sm:text-xl font-semibold cursor-pointer text-white group-hover:text-[#26AA26] transition-colors duration-300'
                                >
                                    {question.title}
                                </h3>
                            </div>
                            {!answerHidden && (
                                <div className='animate-in slide-in-from-top-2 duration-300'>
                                    <p className='text-sm text-gray-300 leading-relaxed bg-neutral-800/30 p-4 rounded-lg border-l-4 border-[#26AA26]' draggable={false}>
                                        {question.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                <div className='relative'>
                    <div className='absolute inset-0 bg-[#26AA26] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md'></div>
                    <ArrowDown className={`relative h-6 w-6 text-gray-400 group-hover:text-[#26AA26] transition-all duration-500 transform ${answerHidden ? 'rotate-0' : 'rotate-180'}`} />
                </div>
            </div>
        )
    }    

    return (
        <section 
            className='w-full h-auto flex flex-col justify-start items-start gap-12 py-12 sm:py-16 xl:py-40 px-4 sm:px-6 xl:px-32 relative overflow-hidden'
            style={{backgroundColor: '#141414'}}
        >
            {/* Effet de fond dynamique */}
            {/* <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(38,170,38,0.05),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(38,170,38,0.03),transparent_40%)]'></div>
            <div className='absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(38,170,38,0.01)_50%,transparent_52%)]'></div> */}
            
            <div className='relative z-10 w-full'>
                <Headings 
                    title="FAQ" 
                    cta={
                            <Link href="/about/faq">
                                <Button 
                                    variant={'outline'} 
                                    className="
                                        w-full sm:w-44 md:w-48 xl:w-48 
                                        h-10 sm:h-11 md:h-12
                                        text-sm sm:text-base
                                        mt-2 sm:mt-0
                                        border-2 border-[#26AA26] text-[#26AA26] bg-transparent
                                        hover:bg-[#26AA26] hover:text-white hover:shadow-lg hover:shadow-[#26AA26]/30
                                        transition-all duration-300 transform
                                        font-semibold
                                    "
                                >
                                    Voir tout
                                </Button>
                            </Link>
                    }
                    sx='flex-row! justify-between!'
                />
            </div>

            <div className='relative z-10 w-full h-auto grid grid-cols-1 md:grid-cols-2 gap-6'>
                {
                    questions && questions.length > 0 && !isLoading && !isError ? (
                        questions.map((question, index) => (
                            <div 
                                key={question.id + uuid()}
                                style={{animationDelay: `${index * 100}ms`}}
                            >
                                {RenderQuestion(question, isLoading, isError)}
                            </div>
                        ))
                    ) : (
                        Array.from({length: 10}).map((_, index) => (
                            <div 
                                key={index}
                                className='animate-pulse'
                                style={{animationDelay: `${index * 100}ms`}}
                            >
                                {RenderQuestion(emptyQuestion, isLoading, isError)}
                            </div>
                        ))
                    )
                }
            </div>

            {/* Éléments décoratifs */}
            {/* <div className='absolute top-1/4 left-10 w-2 h-2 bg-[#26AA26] rounded-full opacity-30 animate-pulse'></div>
            <div className='absolute top-3/4 right-10 w-3 h-3 bg-[#26AA26] rounded-full opacity-20 animate-pulse' style={{animationDelay: '1s'}}></div>
            <div className='absolute bottom-1/4 left-1/3 w-1 h-1 bg-[#26AA26] rounded-full opacity-40 animate-pulse' style={{animationDelay: '2s'}}></div> */}
        </section>
    )
}

export default FAQ