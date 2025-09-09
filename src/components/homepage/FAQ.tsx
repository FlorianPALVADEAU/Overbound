'use client'
import React, { useState } from 'react'
import Headings from '../globals/Headings'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import { Skeleton } from '../ui/skeleton'
import { QuestionType } from '@/types/Question'
import { Button } from '../ui/button'
import { ArrowDown } from 'lucide-react'
import { v4 as uuid } from 'uuid';

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
                className='w-full h-auto flex justify-between items-start gap-3 p-6 border border-gray-200 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md'
                onClick={() => setAnswerHidden(!answerHidden)}
                key={question.id + uuid()}
            >
                    {loading || err ? (
                        <Skeleton className='w-full h-6 rounded-md' />
                    ) : (
                        <div className='w-9/10 flex flex-col gap-3'>
                            <h3 
                                className='text-lg sm:text-xl font-semibold cursor-pointer'
                            >
                                {question.title}
                            </h3>
                            {!answerHidden && (
                                <p className='text-sm text-gray-500' draggable={false}>
                                    {question.answer}
                                </p>
                            )}
                        </div>
                    )}
                <ArrowDown className={`h-6 w-6 ${answerHidden ? 'rotate-0' : 'rotate-180'}`} />
            </div>
        )
    }    

    return (
        <section className='w-full h-auto flex flex-col justify-start items-start gap-12 py-12 sm:py-16 xl:py-40 px-4 sm:px-6 xl:px-32'>
            <Headings 
                title="FAQ" 
                cta={
                    <Button variant="outline">Voir plus</Button>
                }
                sx='flex-row! justify-between!'
            />
            <div className='w-full h-auto grid grid-cols-1 md:grid-cols-2 gap-6'>
                {
                    questions && questions.length > 0 && !isLoading && !isError ? (
                        questions.map((question) => (
                            RenderQuestion(question, isLoading, isError)
                        ))
                    ) : (
                        Array.from({length: 10}).map((_, index) => (
                            RenderQuestion(emptyQuestion, isLoading, isError)
                        ))
                    )
                }
            </div>
        </section>
    )
}

export default FAQ