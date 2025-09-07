import React from 'react'

export type HeadingsProps = {
    title: string;
    description?: string;
    cta?: React.ReactNode;
    sx?: string;
}

const Headings = ({ title, description, cta, sx }: HeadingsProps) => {
    return (
        <div className={`w-full h-auto flex ${cta ? 'flex-row justify-between items-center' : 'flex-col justify-start items-start'} gap-2 text-left ${sx}`}>
            <div className='flex flex-col gap-2'>
                <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold'>
                    {title}
                </h2>
                {
                    description && (
                        <p className='text-lg sm:text-xl lg:text-2xl text-gray-600 font-light'>
                            {description}
                        </p>
                    )
                }
            </div>
            {
                cta && cta
            }
        </div>
    )
}

export default Headings