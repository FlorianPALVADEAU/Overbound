'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { DepartureSlot, FormatCounts } from '@/lib/account/stats'
import {
  TEASER_GROUP_KM_CUMULATIVE,
  TEASER_KM_CUMULATIVE,
  TEASER_LAPS_PER_EDITION,
  TEASER_OBSTACLE_SKILLS,
  TEASER_PACE_PER_LAP,
} from './mockStats'

const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 12 }

/** Recharts needs literal colours; the ranked slice is a neutral light tone. */
const FORMAT_COLORS = { open: 'var(--primary)', ranked: '#e5e5e5', other: '#525252' } as const
const FORMAT_LABELS = { open: 'OPEN', ranked: 'RANKED', other: 'Autre' } as const

/** OPEN vs RANKED split with the total in the middle. */
export function FormatDonut({ counts }: { counts: FormatCounts }) {
  const data = (Object.keys(counts) as Array<keyof FormatCounts>)
    .filter((key) => counts[key] > 0)
    .map((key) => ({ key, label: FORMAT_LABELS[key], value: counts[key] }))
  const total = data.reduce((sum, entry) => sum + entry.value, 0)
  const config = { value: { label: 'Dossards' } } satisfies ChartConfig

  return (
    <div className="flex items-center gap-6">
      <div className="relative size-36 shrink-0">
        <ChartContainer config={config} className="size-36">
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
            <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="label" innerRadius={44} outerRadius={64} paddingAngle={2} strokeWidth={0}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={FORMAT_COLORS[entry.key]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <p className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black leading-none tabular-nums">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">dossards</span>
        </p>
      </div>
      <ul className="space-y-2">
        {data.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2 text-sm">
            <span className="size-3 rounded-sm" style={{ background: FORMAT_COLORS[entry.key] }} aria-hidden />
            <span className="font-semibold">{entry.label}</span>
            <span className="tabular-nums text-muted-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** When the group sets off: one bar per half hour. */
export function DepartureBars({ slots }: { slots: DepartureSlot[] }) {
  const config = { count: { label: 'Partants' } } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="h-44 w-full">
      <BarChart data={slots} margin={{ top: 18, left: 4, right: 4 }} accessibilityLayer>
        <XAxis dataKey="slot" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis hide allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="count" position="top" className="fill-foreground text-xs font-bold" />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** Registered members out of the whole group, as a ring. */
export function CompletionRing({ value, total }: { value: number; total: number }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  const config = { percent: { label: 'Inscrits' } } satisfies ChartConfig

  return (
    <div className="relative size-36">
      <ChartContainer config={config} className="size-36">
        <RadialBarChart data={[{ percent }]} startAngle={90} endAngle={-270} innerRadius={52} outerRadius={68} accessibilityLayer>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="percent" background={{ fill: 'var(--muted)' }} cornerRadius={8} fill="var(--primary)" isAnimationActive={false} />
        </RadialBarChart>
      </ChartContainer>
      <p className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none tabular-nums">
          {value}/{total}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">inscrits</span>
      </p>
    </div>
  )
}

/** Bibs per edition. */
export function EditionBars({ entries }: { entries: Array<{ title: string; bibs: number }> }) {
  const config = { bibs: { label: 'Dossards' } } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="h-40 w-full">
      <BarChart data={entries} margin={{ top: 18, left: 4, right: 4 }} accessibilityLayer>
        <XAxis dataKey="title" tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={(value: string) => value.match(/\d{4}$/)?.[0] ?? value} />
        <YAxis hide allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="bibs" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={36} isAnimationActive={false}>
          <LabelList dataKey="bibs" position="top" className="fill-foreground text-xs font-bold" />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/* ---- Sample charts: only rendered blurred inside <ComingSoon>, fed by mockStats ---- */

const SAMPLE_CONFIG = { value: { label: 'Valeur', color: 'var(--primary)' } } satisfies ChartConfig

function SampleHeadline({ value, unit, caption }: { value: string; unit: string; caption: string }) {
  return (
    <div className="mb-3">
      <p className="text-4xl font-black leading-none tracking-tighter tabular-nums">
        {value} <span className="text-lg font-bold text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">{caption}</p>
    </div>
  )
}

function CumulativeArea({ data, gradientId }: { data: Array<{ label: string; km: number }>; gradientId: string }) {
  return (
    <ChartContainer config={SAMPLE_CONFIG} className="h-40 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis hide />
        <Area dataKey="km" type="monotone" stroke="var(--primary)" strokeWidth={2.5} fill={`url(#${gradientId})`} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  )
}

export function SampleKmChart() {
  return (
    <>
      <SampleHeadline value="128" unit="km" caption="+32 km cette saison" />
      <CumulativeArea data={TEASER_KM_CUMULATIVE} gradientId="sample-km" />
    </>
  )
}

export function SampleLapsChart() {
  return (
    <>
      <SampleHeadline value="64" unit="tours" caption="Record : 16 tours" />
      <ChartContainer config={SAMPLE_CONFIG} className="h-40 w-full">
        <BarChart data={TEASER_LAPS_PER_EDITION} margin={{ left: 4, right: 4, top: 8 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis hide />
          <Bar dataKey="laps" fill="var(--primary)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </>
  )
}

export function SamplePaceChart() {
  return (
    <>
      <SampleHeadline value="6:12" unit="/km" caption="Allure moyenne" />
      <ChartContainer config={SAMPLE_CONFIG} className="h-40 w-full">
        <LineChart data={TEASER_PACE_PER_LAP} margin={{ left: 4, right: 4, top: 8 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis hide domain={['dataMin - 0.3', 'dataMax + 0.3']} />
          <Line dataKey="pace" type="monotone" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--primary)' }} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </>
  )
}

export function SampleSkillsRadar() {
  return (
    <ChartContainer config={SAMPLE_CONFIG} className="mx-auto h-56 w-full max-w-xs">
      <RadarChart data={TEASER_OBSTACLE_SKILLS}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="skill" tick={AXIS_TICK} />
        <Radar dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="var(--primary)" fillOpacity={0.3} isAnimationActive={false} />
      </RadarChart>
    </ChartContainer>
  )
}

export function SampleGroupKmChart({ goalKm }: { goalKm: number }) {
  const current = TEASER_GROUP_KM_CUMULATIVE.at(-1)?.km ?? 0
  return (
    <>
      <SampleHeadline value={String(current)} unit={`/ ${goalKm} km`} caption="Objectif collectif" />
      <CumulativeArea data={TEASER_GROUP_KM_CUMULATIVE} gradientId="sample-group-km" />
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((current / goalKm) * 100)}%` }} />
      </div>
    </>
  )
}
