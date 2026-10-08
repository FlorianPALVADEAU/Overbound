import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  className?: string
}

export function SectionHeading({ eyebrow, title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-balance wrap-break-word text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-base text-gray-300 sm:text-lg">{description}</p>
      ) : null}
    </div>
  )
}
