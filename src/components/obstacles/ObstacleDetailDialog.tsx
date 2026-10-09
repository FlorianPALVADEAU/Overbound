'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, ExternalLink, HeartHandshake, Play, Ruler, Weight, ShieldAlert, Zap } from 'lucide-react'
import type { Obstacle } from '@/types/Obstacle'

interface ObstacleDetailDialogProps {
  obstacle: Obstacle | null
  onOpenChange: (open: boolean) => void
}

const weightSummary = (obstacle: Obstacle) => {
  const parts = [
    obstacle.weight_male ? `${obstacle.weight_male} (H)` : null,
    obstacle.weight_female ? `${obstacle.weight_female} (F)` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

interface SpecCell {
  icon: typeof Ruler
  label: string
  value: string
  tone?: 'default' | 'warning'
}

const buildSpecs = (obstacle: Obstacle): SpecCell[] => {
  const specs: SpecCell[] = []
  if (obstacle.metric_label && obstacle.metric_value) {
    specs.push({ icon: Ruler, label: obstacle.metric_label, value: obstacle.metric_value })
  }
  const weight = weightSummary(obstacle)
  if (weight) {
    specs.push({ icon: Weight, label: 'Charge', value: weight })
  }
  if (obstacle.penalty) {
    specs.push({ icon: ShieldAlert, label: 'Pénalité', value: obstacle.penalty, tone: 'warning' })
  }
  return specs
}

/**
 * Full obstacle detail dialog, shared by /obstacles and the homepage
 * carousel (ObstaclesOverview) so both entry points open the same
 * information instead of duplicating this JSX. Kept deliberately light:
 * only the obstacle's actual specs (metric, weight, penalty) get visual
 * weight, everything else (media, women's variant note, actions) is
 * secondary.
 */
export function ObstacleDetailDialog({ obstacle, onOpenChange }: ObstacleDetailDialogProps) {
  const specs = obstacle ? buildSpecs(obstacle) : []
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!obstacle) return
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'
    const url = `${siteUrl}/obstacles?obstacle=${obstacle.id}`
    const text = `Découvre l'obstacle "${obstacle.name}" sur Overbound !\n${url}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: obstacle.name, text })
        return
      } catch {
        return
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={!!obstacle} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[90vw] overflow-hidden border-white/10 bg-[#141414] p-0 text-white sm:max-w-xl">
        {obstacle && (
          <>
            <DialogHeader className="space-y-3 px-6 pt-6">
              <DialogTitle className="text-2xl font-black text-white">{obstacle.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-6">
              <div className="relative h-56 overflow-hidden rounded-2xl bg-white/5 sm:h-64">
                {obstacle.video_url ? (
                  <iframe
                    className="h-full w-full"
                    src={obstacle.video_url.replace('watch?v=', 'embed/')}
                    title={`Vidéo ${obstacle.name}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : obstacle.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={obstacle.image_url} alt={obstacle.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Zap className="h-16 w-16 text-primary/60" />
                  </div>
                )}
              </div>

              {obstacle.description ? (
                <p className="text-sm leading-relaxed text-neutral-300">{obstacle.description}</p>
              ) : null}

              {specs.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {specs.map((spec) => (
                    <div
                      key={spec.label}
                      className={`rounded-xl border p-3 ${
                        spec.tone === 'warning'
                          ? 'border-amber-500/20 bg-amber-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <spec.icon
                        className={`mb-1.5 h-4 w-4 ${spec.tone === 'warning' ? 'text-amber-300' : 'text-primary'}`}
                      />
                      <p
                        className={`text-[11px] font-semibold uppercase tracking-wide ${
                          spec.tone === 'warning' ? 'text-amber-300/80' : 'text-neutral-400'
                        }`}
                      >
                        {spec.label}
                      </p>
                      <p className={`text-sm font-semibold ${spec.tone === 'warning' ? 'text-amber-200' : 'text-white'}`}>
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-neutral-400">
                <HeartHandshake className="mt-0.5 h-4 w-4 flex-none text-primary" />
                <p>
                  <strong className="text-neutral-300">Adapté aux femmes :</strong> une version
                  ajustée (hauteur, prise, charge) est proposée pour permettre à chacune de le
                  franchir en confiance.
                </p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-4 text-xs">
                {obstacle.video_url ? (
                  <button
                    type="button"
                    onClick={() => window.open(obstacle.video_url ?? '', '_blank')}
                    className="inline-flex items-center gap-1.5 text-neutral-400 transition hover:text-white"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Voir la vidéo complète
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-neutral-400 transition hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                  {copied ? 'Lien copié' : 'Partager cet obstacle'}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
