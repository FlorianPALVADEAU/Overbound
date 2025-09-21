'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, Users, XCircle } from 'lucide-react'

interface RegistrationStatsProps {
  stats: {
    total: number
    approved: number
    pending: number
    rejected: number
    checked_in: number
  }
}

export function RegistrationStats({ stats }: RegistrationStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Approuvés</p>
              <p className="text-xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Rejetés</p>
              <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Présents</p>
              <p className="text-xl font-bold text-blue-600">{stats.checked_in}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
