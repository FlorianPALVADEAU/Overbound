import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/account/profile'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  email?: string | null
  className?: string
  /** Style of the initials fallback: brand-coloured (captain, highlighted) or neutral. */
  tone?: 'brand' | 'neutral'
}

/** The one avatar used across the account: photo when there is one, initials otherwise. */
export function UserAvatar({ src, name, email, className, tone = 'brand' }: UserAvatarProps) {
  return (
    <Avatar className={cn('size-10', className)}>
      {src ? <AvatarImage src={src} alt="" referrerPolicy="no-referrer" className="object-cover" /> : null}
      <AvatarFallback
        className={cn('text-xs font-bold', tone === 'brand' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
      >
        {getInitials(name, email)}
      </AvatarFallback>
    </Avatar>
  )
}
