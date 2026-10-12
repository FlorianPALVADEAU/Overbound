#!/usr/bin/env node
/**
 * Design-system guard (docs/design/design-system.md, ADR-0005).
 *
 * Counts forbidden styling patterns in the public UI and compares them with a
 * committed baseline (ratchet): a file may keep its legacy violations while it
 * waits for migration, but no count may grow and no new file may add any.
 *
 *   node scripts/lint-design.mjs            check (CI, npm run lint)
 *   node scripts/lint-design.mjs --update   rewrite the baseline after a cleanup
 *                                           (refused if any count went up)
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const BASELINE_PATH = join(ROOT, 'scripts', 'design-baseline.json')
const SCAN_DIRS = ['src/app', 'src/components']
const EXCLUDED = [
  /^src\/components\/ui\//, // shadcn primitives keep their upstream classes
  /^src\/app\/(api|studio)\//,
  /\.test\.tsx?$/,
]

export const RULES = [
  { id: 'arbitrary-hex', hint: 'use a color token (bg-primary, text-foreground...)', re: /-\[#[0-9a-fA-F]{3,8}\]/g },
  {
    id: 'raw-gray',
    hint: 'use text-foreground / text-muted-foreground / text-subtle or a surface token',
    re: /\b(?:text|bg|border|from|via|to|ring|divide)-(?:gray|neutral|zinc|slate|stone)-\d{2,3}\b/g,
  },
  { id: 'arbitrary-font-size', hint: 'use the type scale (text-label, text-eyebrow, text-sm...)', re: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g },
  { id: 'arbitrary-tracking', hint: 'use tracking-tight, tracking-eyebrow or tracking-label', re: /\btracking-\[/g },
  { id: 'font-black', hint: 'strong titles use font-display (SectionHeader / DISPLAY_TITLE)', re: /\bfont-black\b/g },
  { id: 'raw-red', hint: 'use Button variant="signal" (header CTA) or destructive (errors)', re: /\bbg-red-\d{2,3}\b/g },
  {
    id: 'raw-status-color',
    // Admin only: the public site has its own status styling still to migrate.
    only: /^src\/(components\/admin|app\/dashboard)\//,
    hint: 'use text-success / text-warning / text-info / text-destructive (and /10 /20 /40 for fills and borders)',
    re: /\b(?:text|bg|border|from|via|to|ring|divide)-(?:red|green|blue|amber|yellow|orange|emerald|sky|purple|violet|indigo|pink|rose|teal|cyan|lime)-\d{2,3}\b/g,
  },
  { id: 'dark-variant', hint: 'the site is dark-only: no dark: variants', re: /\bdark:/g },
  { id: 'container-width', hint: 'use <Container> or containerClass() from @/components/ds', re: /\bmax-w-(?:6xl|7xl)\b/g },
]

function listFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listFiles(full))
    else if (/\.(tsx|ts)$/.test(name)) out.push(full)
  }
  return out
}

function toPosix(path) {
  return path.split(sep).join('/')
}

export function countViolations(source, file = '') {
  const counts = {}
  for (const rule of RULES) {
    if (rule.only && !rule.only.test(file)) continue
    const n = source.match(rule.re)?.length ?? 0
    if (n > 0) counts[rule.id] = n
  }
  return counts
}

function scan() {
  const result = {}
  for (const dir of SCAN_DIRS) {
    for (const file of listFiles(join(ROOT, dir))) {
      const rel = toPosix(relative(ROOT, file))
      // The design system itself defines the allowed container widths.
      if (rel.startsWith('src/components/ds/')) continue
      if (EXCLUDED.some((re) => re.test(rel))) continue
      const counts = countViolations(readFileSync(file, 'utf8'), rel)
      if (Object.keys(counts).length > 0) result[rel] = counts
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))
}

function lineHits(file, ruleId) {
  const rule = RULES.find((r) => r.id === ruleId)
  return readFileSync(join(ROOT, file), 'utf8')
    .split('\n')
    .flatMap((line, i) => (line.match(new RegExp(rule.re.source)) ? [`    ${file}:${i + 1}`] : []))
}

export function compare(current, baseline) {
  const regressions = []
  for (const [file, counts] of Object.entries(current)) {
    for (const [ruleId, n] of Object.entries(counts)) {
      const allowed = baseline[file]?.[ruleId] ?? 0
      if (n > allowed) regressions.push({ file, ruleId, n, allowed })
    }
  }
  return regressions
}

function main() {
  const update = process.argv.includes('--update')
  const bootstrap = !existsSync(BASELINE_PATH)
  const baseline = bootstrap ? {} : JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  const current = scan()
  // First run: the baseline records today's legacy state as the starting point.
  const regressions = update && bootstrap ? [] : compare(current, baseline)

  if (regressions.length > 0) {
    console.error('Design-system violations (docs/design/design-system.md):\n')
    for (const { file, ruleId, n, allowed } of regressions) {
      const rule = RULES.find((r) => r.id === ruleId)
      console.error(`  ${ruleId} in ${file}: ${n} (baseline ${allowed}) — ${rule.hint}`)
      console.error(lineHits(file, ruleId).join('\n'))
    }
    console.error('\nFix the new code. The baseline only goes down.')
    process.exit(1)
  }

  const total = (data) => Object.values(data).reduce((sum, c) => sum + Object.values(c).reduce((a, b) => a + b, 0), 0)
  if (update) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(current, null, 2)}\n`)
    console.log(`Baseline updated: ${total(baseline)} -> ${total(current)} legacy violations.`)
    return
  }
  const gained = total(baseline) - total(current)
  console.log(
    `Design system OK: ${total(current)} legacy violations left${gained > 0 ? ` (${gained} fixed, run with --update to lock them in)` : ''}.`,
  )
}

if (import.meta.url === `file://${process.argv[1]}`) main()
