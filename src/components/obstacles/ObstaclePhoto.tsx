import Image from 'next/image'
import { resolveImageSource } from '@/lib/images/imageSource'
import { cn } from '@/lib/utils'

interface Props {
  /** Image URL as stored in the database: local path, our own domain or a remote host. */
  url: string
  alt: string
  /** Rendered width of the card, so the browser downloads a matching size. */
  sizes: string
  className?: string
}

/** Obstacle photo filling its (relative) card, resized by next/image when the host allows it. */
export function ObstaclePhoto({ url, alt, sizes, className }: Props) {
  const { src, optimizable } = resolveImageSource(url)
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={!optimizable}
      className={cn('object-cover', className)}
    />
  )
}
