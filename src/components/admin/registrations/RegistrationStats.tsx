'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Users } from 'lucide-react'

interface RegistrationStatsProps {
  stats: {
    total: number
    checked_in: number
  }
}

export function RegistrationStats({ stats }: RegistrationStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
      <Card variant="info">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card variant="info">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-info" />
            <div>
              <p className="text-sm text-muted-foreground">Présents</p>
              <p className="text-xl font-bold text-info">{stats.checked_in}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
