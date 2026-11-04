'use client'

import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminAmbassadorSheetResponse } from '@/lib/admin/ambassadors/types'

interface AmbassadorSheetHeaderProps {
  sheet: AdminAmbassadorSheetResponse
  onSeasonChange: (season: number) => void
  onEditPoints: () => void
  onAddReferral: () => void
}

/** Identity of the ambassador, the season switch and the three actions a sheet is opened for. */
export function AmbassadorSheetHeader({ sheet, onSeasonChange, onEditPoints, onAddReferral }: AmbassadorSheetHeaderProps) {
  const { ambassador, program_year: season, current_season: currentSeason, available_program_years: seasons } = sheet
  const description = [
    ambassador.code ? `Code ${ambassador.code}` : 'Aucun code actif',
    ambassador.is_active ? 'Compte actif' : 'Compte inactif',
    season === currentSeason ? `Saison ${season} en cours` : `Saison ${season} passée`,
  ].join(' · ')

  return (
    <AdminPageHeader
      eyebrow="Communauté"
      title={ambassador.name}
      description={description}
      actions={
        // Phone: season on its own row, the main action full width, the two others side by side. From md: one row.
        <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:max-w-md md:flex-wrap md:items-center md:justify-end">
          <Select value={String(season)} onValueChange={(value) => onSeasonChange(Number(value))}>
            <SelectTrigger className="col-span-2 w-full md:w-40" aria-label="Saison"><SelectValue /></SelectTrigger>
            <SelectContent>
              {seasons.map((year) => (
                <SelectItem key={year} value={String(year)}>{year === currentSeason ? `${year} (en cours)` : String(year)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" className="col-span-2 min-h-11 md:min-h-9" onClick={onEditPoints}>Modifier les points</Button>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-9" onClick={onAddReferral}>Ajouter un filleul</Button>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-9" asChild>
            <a href={`/ambassadors/dashboard?as=${encodeURIComponent(ambassador.id)}`} target="_blank" rel="noopener noreferrer">
              Voir son espace
            </a>
          </Button>
        </div>
      }
    />
  )
}
