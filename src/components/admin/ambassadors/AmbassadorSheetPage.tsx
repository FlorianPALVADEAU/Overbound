'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useAdminAmbassadorSheet } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AmbassadorPointsDialog } from './AmbassadorPointsDialog'
import { ManualReferralDialog } from './ManualReferralDialog'
import { AmbassadorCodesPanel } from './sheet/AmbassadorCodesPanel'
import { AmbassadorSheetHeader } from './sheet/AmbassadorSheetHeader'
import { AmbassadorHistoryPanel } from './sheet/AmbassadorHistoryPanel'
import { AmbassadorReferralsPanel } from './sheet/AmbassadorReferralsPanel'
import { AmbassadorRewardsPanel } from './sheet/AmbassadorRewardsPanel'
import { AmbassadorSeasonStats } from './sheet/AmbassadorSeasonStats'
import { useRewardActions } from './useRewardActions'

type SheetTab = 'rewards' | 'referrals' | 'codes' | 'history'
type OpenDialog = 'points' | 'referral' | null

const TABS: ReadonlyArray<{ value: SheetTab; label: string }> = [
  { value: 'rewards', label: 'Récompenses' },
  { value: 'referrals', label: 'Filleuls' },
  { value: 'codes', label: 'Codes' },
  { value: 'history', label: 'Historique' },
]

/**
 * One ambassador, one page. The season figures and rewards show at once; referrals, codes and history load
 * only when their tab opens, so the first paint stays small.
 */
export function AmbassadorSheetPage({ ambassadorId }: { ambassadorId: string }) {
  const [season, setSeason] = useState<number | null>(null)
  const [tab, setTab] = useState<SheetTab>('rewards')
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const query = useAdminAmbassadorSheet(ambassadorId, season)
  const actions = useRewardActions()
  const sheet = query.data

  return (
    <div className="grid gap-8">
      <Link href="/dashboard/ambassadors" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" />
        Retour aux ambassadeurs
      </Link>

      {query.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{query.error.message}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => void query.refetch()}>
              <RefreshCw /> Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!sheet && !query.error ? <p className="text-sm text-muted-foreground">Chargement de la fiche…</p> : null}

      {sheet ? (
        <>
          <AmbassadorSheetHeader
            sheet={sheet}
            onSeasonChange={setSeason}
            onEditPoints={() => setDialog('points')}
            onAddReferral={() => setDialog('referral')}
          />

          {actions.notice ? (
            <Alert variant={actions.notice.tone === 'error' ? 'destructive' : 'default'} role="status">
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{actions.notice.text}</span>
                <Button type="button" variant="ghost" size="sm" onClick={actions.clearNotice}>Fermer</Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <AmbassadorSeasonStats sheet={sheet} />

          <Tabs value={tab} onValueChange={(value) => setTab(value as SheetTab)} className="gap-6">
            <TabsList className="grid h-auto w-full grid-cols-2 sm:inline-flex sm:h-9 sm:w-fit">
              {TABS.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="py-1.5">{item.label}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="rewards">
              <AmbassadorRewardsPanel sheet={sheet} actions={actions} />
            </TabsContent>
            <TabsContent value="referrals">
              <AmbassadorReferralsPanel ambassadorId={ambassadorId} isCurrentSeason={sheet.program_year === sheet.current_season} />
            </TabsContent>
            <TabsContent value="codes">
              <AmbassadorCodesPanel ambassadorId={ambassadorId} />
            </TabsContent>
            <TabsContent value="history">
              <AmbassadorHistoryPanel ambassadorId={ambassadorId} />
            </TabsContent>
          </Tabs>

          {dialog === 'points' ? (
            <AmbassadorPointsDialog
              ambassadorId={ambassadorId}
              ambassadorName={sheet.ambassador.name}
              ambassadorCode={sheet.ambassador.code}
              totals={{ total_points: sheet.season.total_points, recruits_open: sheet.season.recruits_open, recruits_ranked: sheet.season.recruits_ranked }}
              programYear={sheet.program_year}
              onClose={() => setDialog(null)}
            />
          ) : null}
          {dialog === 'referral' ? (
            <ManualReferralDialog
              ambassadorId={ambassadorId}
              ambassadorName={sheet.ambassador.name}
              ambassadorCode={sheet.ambassador.code}
              onClose={() => setDialog(null)}
            />
          ) : null}
        </>
      ) : null}
      {actions.dialog}
    </div>
  )
}
