'use client'

import { useState } from 'react'
import { Check, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { joinName } from '@/lib/registration'
import { FLEXIBLE_REFUND_DEADLINE_DAYS, FLEXIBLE_TICKET_FEE_CENTS } from '@/lib/tickets/flexibleTicket'
import { cn } from '@/lib/utils'
import type { Participant } from './types'

interface FlexibleTicketOptionProps {
  participants: Participant[]
  onChange: (participantId: string, flexible: boolean) => void
}

const LONG_LIST = 8

const formatFee = () => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(FLEXIBLE_TICKET_FEE_CENTS / 100)

/**
 * Same frame as the other options (UpsellCard): tile, name and price, one
 * sentence, then "Personne / Tous / Choisir" (or a single Ajouter button for
 * one participant). The fee is per bib, so the choice is per participant.
 */
export default function FlexibleTicketOption({ participants, onChange }: FlexibleTicketOptionProps) {
  const [showList, setShowList] = useState(false)
  const total = participants.length
  const taking = participants.filter((participant) => participant.flexible === true).length
  const mode: 'none' | 'all' | 'some' = taking === 0 ? 'none' : taking === total ? 'all' : 'some'
  const setAll = (flexible: boolean) => participants.forEach((participant) => onChange(participant.id, flexible))
  const nameOf = (participant: Participant, index: number) =>
    joinName(participant.firstName, participant.lastName) || `Participant ${index + 1}`

  return (
    <div className={cn('rounded-2xl border bg-card p-5 transition-colors', taking > 0 ? 'border-primary ring-1 ring-primary' : 'border-border')}>
      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-primary" aria-hidden="true">
          <Undo2 className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-semibold">Billet flexible</p>
            <p className="shrink-0 text-base font-semibold text-primary">{formatFee()}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Annule sans justificatif et récupère le prix du billet jusqu&apos;à {FLEXIBLE_REFUND_DEADLINE_DAYS} jours avant
            l&apos;événement, depuis ton espace.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Un par participant. Les frais de l&apos;option ne sont pas remboursés, et elle est perdue si le billet est transféré.
          </p>
        </div>
      </div>

      {total === 1 ? (
        <div className="mt-4">
          <Button
            type="button"
            id={`${participants[0].id}-flexible`}
            size="cta"
            variant={mode === 'all' ? 'default' : 'outline'}
            className="w-full"
            aria-pressed={mode === 'all'}
            onClick={() => setAll(mode !== 'all')}
          >
            {mode === 'all' ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Ajouté
              </>
            ) : (
              'Ajouter'
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div role="group" aria-label="Pour qui : billet flexible" className="grid grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'Personne', active: mode === 'none', onClick: () => { setAll(false); setShowList(false) } },
              { id: 'all', label: `Tous (${total})`, active: mode === 'all', onClick: () => { setAll(true); setShowList(false) } },
              { id: 'some', label: 'Choisir', active: mode === 'some' || showList, onClick: () => setShowList(true) },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={option.active ? 'default' : 'outline'}
                className="h-11 px-2"
                aria-pressed={option.active}
                onClick={option.onClick}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {mode === 'all' && !showList ? (
            <button
              type="button"
              onClick={() => setShowList(true)}
              className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Retirer quelqu’un
            </button>
          ) : null}

          {showList || mode === 'some' ? (
            <ul className={cn('divide-y divide-border', total > LONG_LIST && 'max-h-96 overflow-y-auto pr-1')}>
              {participants.map((participant, index) => (
                <li key={participant.id} className="py-3">
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                    <Checkbox
                      id={`${participant.id}-flexible`}
                      checked={participant.flexible === true}
                      onCheckedChange={(checked) => onChange(participant.id, checked === true)}
                    />
                    <span className="min-w-0 truncate">{nameOf(participant, index)}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}
