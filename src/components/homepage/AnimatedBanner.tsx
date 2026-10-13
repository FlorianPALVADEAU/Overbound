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
        : 'py-4 lg:py-6 max-h-32'
    const backgroundClass = subtle ? 'bg-transparent text-muted-foreground' : 'tone-light bg-muted text-foreground'
    const gradientFromLeft = subtle ? 'from-transparent' : 'from-muted'
    const gradientFromRight = subtle ? 'from-transparent' : 'from-muted'
    const titleClass = compact ? 'text-sm mx-10 font-medium tracking-wide' : 'text-2xl my-0 mx-[125px] font-semibold'
    const logoBoxClass = compact
        ? 'mx-3 md:mx-5 h-10 md:h-12 lg:h-14 w-16 md:w-20 lg:w-24'
        : 'mx-[25px] md:mx-[50px] h-16 md:h-20 lg:h-24 w-28 md:w-32 lg:w-40'
    const logoImageClass = subtle ? 'object-contain opacity-55' : 'object-contain'

    return (
        <div className={`${wrapperClass} relative overflow-hidden flex flex-row ${backgroundClass}`}>
            {/* fade-in effect */}
            <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-1/3 bg-linear-to-r ${gradientFromLeft} to-transparent z-1`}></div>
            {/* Each copy slides by its own width: 4 copies cover a 3840px screen.
                Only the first copy is exposed to assistive technology. */}
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} aria-hidden={index > 0 || undefined} className='shrink-0 flex items-center justify-around whitespace-nowrap w-fit animate-marquee motion-reduce:animate-none'>
                    {title && (
                        <p className={`shrink-0 text-uppercase ${titleClass}`}>
                                {title?.toUpperCase()}
                            </p>
                        )}
                        {images && (
                            images.map((src, imgIndex) => (
                                <div key={imgIndex} className={`${logoBoxClass} relative shrink-0`}>
                                    <Image
                                        src={src}
                                        alt={index === 0 ? `${imageAltPrefix} ${imgIndex + 1}` : ''}
                                        fill
                                        sizes="(max-width: 768px) 10rem, 16rem"
                                        className={logoImageClass}
                                    />
                                </div>
                            ))
                        )}
                </div>
            ))}
            {/* fade-out effect */}
            <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l ${gradientFromRight} to-transparent z-1`}></div>
        </div>
    )
}

export default AnimatedBanner
