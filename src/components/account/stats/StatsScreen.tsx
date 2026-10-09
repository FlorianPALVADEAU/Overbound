'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useAccountStats } from '@/app/api/account/stats/accountStatsQueries'
import { AccountDataBoundary } from '@/components/account/AccountDataBoundary'
import { AccountScreen, Eyebrow } from '@/components/account/AccountScreen'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLongDate } from '@/lib/account/format'
import type { AccountStats, GroupStats, RunnerStats } from '@/lib/account/stats'
import { cn } from '@/lib/utils'
import { ComingSoon } from './ComingSoon'
import { GroupStatsPanel } from './GroupStatsPanel'
import { ChartBlock, Kpi, SectionHeading, TIMING_HINT } from './StatsBlocks'
import { Leaderboard } from './Leaderboard'
import { TEASER_LEADERBOARD } from './mockStats'
import {
  EditionBars,
  FormatDonut,
  SampleKmChart,
  SampleLapsChart,
  SamplePaceChart,
  SampleSkillsRadar,
} from './StatsCharts'

type StatsTab = 'runner' | 'group'

function RunnerSection({ stats }: { stats: RunnerStats }) {
  if (stats.bibs === 0) {
    return (
      <section>
        <SectionHeading eyebrow="Moi" title="Tes stats arrivent." />
        <p className="max-w-sm text-muted-foreground">Dès ta première inscription, tes dossards, ton format et tes éditions s&apos;affichent ici.</p>
      </section>
    )
  }

  return (
    <section>
      <SectionHeading eyebrow="Moi" title="Ton parcours" />
      <div className="mb-8 grid grid-cols-3 gap-x-4">
        <Kpi value={stats.editions} label={stats.editions > 1 ? 'Éditions' : 'Édition'} />
        <Kpi value={stats.bibs} label="Dossards" />
        <Kpi value={stats.checkedIn} label="Départs validés" />
      </div>
      {stats.bibsForOthers > 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">
          Dont <span className="font-semibold text-foreground">{stats.bibsForOthers}</span> dossard{stats.bibsForOthers > 1 ? 's' : ''} pris pour tes amis.
        </p>
      ) : null}

      <div className="space-y-8">
        <ChartBlock title="Formats">
          <FormatDonut counts={stats.byFormat} />
        </ChartBlock>
        {stats.timeline.length > 1 ? (
          <ChartBlock title="Dossards par édition">
            <EditionBars entries={stats.timeline} />
          </ChartBlock>
        ) : null}

        <ChartBlock title="Kilomètres parcourus">
          <ComingSoon title="Tes kilomètres, édition après édition" hint={TIMING_HINT}>
            <SampleKmChart />
          </ComingSoon>
        </ChartBlock>
        <ChartBlock title="Tours bouclés">
          <ComingSoon title="Ton record de tours" hint={TIMING_HINT}>
            <SampleLapsChart />
          </ComingSoon>
        </ChartBlock>
        <ChartBlock title="Allure par tour">
          <ComingSoon title="Tiens-tu la distance ?" hint={TIMING_HINT}>
            <SamplePaceChart />
          </ComingSoon>
        </ChartBlock>
        <ChartBlock title="Profil d'obstacles">
          <ComingSoon title="Tes points forts sur le parcours" hint="Disponible quand les obstacles réussis seront suivis.">
            <SampleSkillsRadar />
          </ComingSoon>
        </ChartBlock>
      </div>
    </section>
  )
}

function GroupSection({ stats, name }: { stats: GroupStats; name: string }) {
  return (
    <section>
      <SectionHeading eyebrow="Mon groupe" title={name} detail={stats.event ? `${stats.event.title} · ${formatLongDate(stats.event.date) ?? ''}` : null} />
      <GroupStatsPanel stats={stats} />
    </section>
  )
}

function NoGroupSection() {
  return (
    <section>
      <SectionHeading eyebrow="Mon groupe" title="Pas encore de groupe." />
      <p className="mb-5 max-w-sm text-muted-foreground">Crée ou rejoins un groupe pour comparer vos formats, vos heures de départ et, bientôt, vos kilomètres.</p>
      <Button asChild className="mb-8 h-11 px-6 font-bold">
        <Link href="/account/group">Créer ou rejoindre</Link>
      </Button>
      <ChartBlock title="Classement du groupe">
        <ComingSoon title="Qui a couru le plus loin ?" hint="Rejoins un groupe pour débloquer le classement.">
          <Leaderboard rows={TEASER_LEADERBOARD} />
        </ComingSoon>
      </ChartBlock>
    </section>
  )
}

function TabSwitch({ value, onChange }: { value: StatsTab; onChange: (tab: StatsTab) => void }) {
  const tabs: Array<{ id: StatsTab; label: string }> = [
    { id: 'runner', label: 'Moi' },
    { id: 'group', label: 'Mon groupe' },
  ]
  return (
    <div role="tablist" aria-label="Statistiques" className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 lg:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn('h-10 rounded-lg text-sm font-bold transition-colors', value === tab.id ? 'bg-foreground text-background' : 'text-muted-foreground')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function StatsContent() {
  const { data, isLoading, error, refetch } = useAccountStats()
  const [tab, setTab] = useState<StatsTab>('runner')

  if (isLoading) {
    return (
      <div className="grid gap-12 lg:grid-cols-2" aria-busy="true">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="hidden h-96 w-full lg:block" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4 py-10">
        <p className="font-bold">Impossible de charger tes statistiques</p>
        <p className="text-sm text-muted-foreground">{error?.message}</p>
        <Button onClick={() => refetch()} className="h-11 px-6">
          Réessayer
        </Button>
      </div>
    )
  }

  const stats: AccountStats = data
  return (
    <>
      <TabSwitch value={tab} onChange={setTab} />
      <div className="lg:grid lg:grid-cols-2 lg:gap-16">
        <div className={cn(tab !== 'runner' && 'hidden lg:block')}>
          <RunnerSection stats={stats.runner} />
        </div>
        <div className={cn(tab !== 'group' && 'hidden lg:block')}>
          {stats.group ? <GroupSection stats={stats.group} name={stats.group.name} /> : <NoGroupSection />}
        </div>
      </div>
    </>
  )
}

export function StatsScreen() {
  return (
    <AccountDataBoundary>
      {() => (
        <AccountScreen>
          <header className="mb-8">
            <Eyebrow>Statistiques</Eyebrow>
            <h1 className="mt-2 text-balance text-[2.5rem] font-black leading-[0.95] tracking-tight md:text-5xl">Tes chiffres.</h1>
          </header>
          <StatsContent />
        </AccountScreen>
      )}
    </AccountDataBoundary>
  )
}
