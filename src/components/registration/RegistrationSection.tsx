import type { ReactNode, Ref } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegistrationSectionProps {
  index: number
  title: string
  description: string
  isComplete?: boolean
  optional?: boolean
  children: ReactNode
  sectionRef?: Ref<HTMLDivElement>
}

export default function RegistrationSection({
  index,
  title,
  description,
  isComplete = false,
  optional = false,
  children,
  sectionRef,
}: RegistrationSectionProps) {
  return (
    <div ref={sectionRef} className="scroll-mt-6">
      <Card className={optional ? 'border-dashed' : undefined}>
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
              isComplete
                ? 'border-primary bg-primary text-primary-foreground'
                : optional
                  ? 'border-dashed border-muted-foreground/30 text-muted-foreground'
                  : 'border-muted-foreground/30 bg-muted text-muted-foreground',
            )}
          >
            {isComplete ? <Check className="h-4 w-4" /> : index}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold leading-none">{title}</h2>
              {/* {optional ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Optionnel
                </span>
              ) : null} */}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  )
}
