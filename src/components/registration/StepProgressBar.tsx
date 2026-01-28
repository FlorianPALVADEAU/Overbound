import { Progress } from '@/components/ui/progress'
import { REGISTRATION_STEPS } from '@/constants/registration'

interface StepProgressBarProps {
  stepIndex: number
  stepProgress: number
}

export default function StepProgressBar({ stepIndex, stepProgress }: StepProgressBarProps) {
  const step = REGISTRATION_STEPS[stepIndex]

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Étape {stepIndex + 1} sur {REGISTRATION_STEPS.length}
          </span>
          <span>{Math.round(stepProgress)}%</span>
        </div>
        <Progress value={stepProgress} className="h-2" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{step?.title}</h3>
        <p className="text-sm text-muted-foreground">{step?.description}</p>
      </div>
    </div>
  )
}
