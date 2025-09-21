'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { RegistrationApprovalStatus } from '@/types/Registration'

interface RegistrationFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: RegistrationApprovalStatus | 'all'
  onStatusChange: (value: RegistrationApprovalStatus | 'all') => void
}

export function RegistrationFilters({ searchTerm, onSearchChange, statusFilter, onStatusChange }: RegistrationFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher par email, événement..."
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as RegistrationApprovalStatus | 'all')}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
