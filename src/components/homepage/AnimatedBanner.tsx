import Image from "next/image"

const AnimatedBanner = ({ title, images }: { title?: string, images?: string[] }) => {
    return (
        <div className='py-[15px] lg:py-[30px] relative overflow-hidden bg-neutral-200 flex flex-row text-black'>
            {/* fade-in effect */}
            <div className='pointer-events-none absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-white to-transparent z-[1]'></div>
            {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className='shrink-0 flex items-center justify-around whitespace-nowrap w-fit animate-marquee'>
                    {title && (
                        <p className='shrink-0 text-2xl text-uppercase my-0 mx-[125px] font-semibold'>
                                {title?.toUpperCase()}
                            </p>
                        )}
                        {images && (
                            images.map((src, imgIndex) => (
                                <div key={imgIndex} className='mx-[50px]'>
                                    <Image
                                        src={src}
                                        alt={`Banner Image ${imgIndex + 1}`}
                                        width={100}
                                        height={50}
                                        className='h-10 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain'
                                    />
                                </div>
                            ))
                        )}
                </div>
            ))}
            {/* fade-out effect */}
            <div className='pointer-events-none absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white to-transparent z-[1]'></div>
            <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
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

export default AnimatedBanner