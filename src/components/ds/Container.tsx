import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * The only three content widths of the site (docs/design/design-system.md):
 * page = every marketing section, prose = long text (blog, legal), form = auth,
 * account and registration screens. Same horizontal gutters everywhere.
 */
export const CONTAINER_SIZES = {
  page: 'max-w-7xl',
  prose: 'max-w-3xl',
  form: 'max-w-xl',
} as const

export type ContainerSize = keyof typeof CONTAINER_SIZES

export function containerClass(size: ContainerSize = 'page') {
  return cn('mx-auto w-full px-4 sm:px-6 lg:px-8', CONTAINER_SIZES[size])
}

interface Props extends ComponentProps<'div'> {
  size?: ContainerSize
}

export function Container({ size = 'page', className, ...props }: Props) {
  return <div className={cn(containerClass(size), className)} {...props} />
}
