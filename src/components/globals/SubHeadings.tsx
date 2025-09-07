import React from 'react'

export type SubHeadingsProps = {
    title: string;
    description?: string;
    cta?: React.ReactNode;
    sx?: string;
}

const SubHeadings = ({ title, description, cta, sx }: SubHeadingsProps) => {
    return (
        <div className={`w-full h-auto flex ${cta ? 'flex-row justify-between items-center' : 'flex-col justify-start items-start'}text-left ${sx}`}>
            <div className='flex flex-col gap-2'>
                <h2 className='text-xl sm:text-2xl md:text-3xl font-bold'>
                    {title}
                </h2>
                {
                    description && (
                        <p className='text-md sm:text-lg lg:text-xl text-gray-600 font-light -mt-1'>
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

export default SubHeadings