'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pause, Play } from 'lucide-react'

interface PauseCampaignButtonProps {
  paused: boolean
  onToggle: (paused: boolean) => Promise<void>
}

// FDR-0014 §10: prominent emergency control. Toggling never touches
// campaign config, rewards, or existing allocations -- the backend route
// enforces that (POST .../pause updates only the `paused` column).
export function PauseCampaignButton({ paused, onToggle }: PauseCampaignButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onToggle(!paused)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={paused ? 'default' : 'destructive'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
      {loading ? 'Mise à jour…' : paused ? 'Reprendre' : 'PAUSE CAMPAGNE'}
    </Button>
  )
}
