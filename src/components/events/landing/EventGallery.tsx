import { CardCarousel } from '@/components/shared/CardCarousel'
import { LANDING_X } from './layout'

interface Props {
  images: string[]
  title: string
}

/** Auto-scrolling photo slider. Renders nothing without images. */
export function EventGallery({ images, title }: Props) {
  if (images.length === 0) return null

  return (
    <section className="py-12 sm:py-16">
      <div className={LANDING_X}>
        <CardCarousel
          items={images.slice(0, 8)}
          getKey={(src) => src}
          roomy
          autoplayMs={4000}
          contentClassName="-ml-3 pb-20"
          itemClassName="pl-3 basis-[82%] sm:basis-[48%] lg:basis-[32%]"
          renderItem={(src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`${title} — ${index + 1}`}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="aspect-4/3 w-full rounded-2xl object-cover ring-1 ring-border/50"
            />
          )}
        />
      </div>
    </section>
  )
}
