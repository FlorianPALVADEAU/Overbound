"use client";
import Image from "next/image"

const AnimatedBanner = ({
    title,
    images,
    imageAltPrefix = "Logo partenaire",
    compact = false,
    subtle = false,
}: {
    title?: string
    images?: string[]
    imageAltPrefix?: string
    compact?: boolean
    subtle?: boolean
}) => {
    const wrapperClass = compact
        ? 'py-2 lg:py-3 max-h-20'
        : 'py-[15px] lg:py-[30px] max-h-32'
    const backgroundClass = subtle ? 'bg-transparent text-muted-foreground' : 'bg-neutral-200 text-black'
    const gradientFromLeft = subtle ? 'from-transparent' : 'from-white'
    const gradientFromRight = subtle ? 'from-transparent' : 'from-white'
    const titleClass = compact ? 'text-sm mx-10 font-medium tracking-wide' : 'text-2xl my-0 mx-[125px] font-semibold'
    const logoBoxClass = compact
        ? 'mx-3 md:mx-5 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14'
        : 'mx-[25px] md:mx-[50px] w-16 h-16 md:w-20 md:h-20 lg:w-28 lg:h-28'
    const logoImageClass = subtle ? 'object-contain opacity-55' : 'object-contain'

    return (
        <div className={`${wrapperClass} relative overflow-hidden flex flex-row ${backgroundClass}`}>
            {/* fade-in effect */}
            <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-1/3 bg-linear-to-r ${gradientFromLeft} to-transparent z-1`}></div>
            {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className='shrink-0 flex items-center justify-around whitespace-nowrap w-fit animate-marquee'>
                    {title && (
                        <p className={`shrink-0 text-uppercase ${titleClass}`}>
                                {title?.toUpperCase()}
                            </p>
                        )}
                        {images && (
                            images.map((src, imgIndex) => (
                                <div key={imgIndex} className={`${logoBoxClass} relative`}>
                                    <Image
                                        src={src}
                                        alt={`${imageAltPrefix} ${imgIndex + 1}`}
                                        fill
                                        className={logoImageClass}
                                    />
                                </div>
                            ))
                        )}
                </div>
            ))}
            {/* fade-out effect */}
            <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l ${gradientFromRight} to-transparent z-[1]`}></div>
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
