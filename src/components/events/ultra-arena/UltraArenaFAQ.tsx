'use client'

import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

const FAQS = [
  {
    id: 'faq-niveau',
    question: 'Faut-il être un athlète confirmé pour participer ?',
    answer:
      "Non. Le format OPEN est conçu pour les profils motivés, pas uniquement les experts. Tu avances à ton rythme, dans un cadre encadré, et tu adaptes ton niveau à chaque obstacle.",
  },
  {
    id: 'faq-format',
    question: 'Quelle différence entre OPEN et RANKED ?',
    answer:
      "OPEN = dépassement personnel sans élimination. Tu gères ton rythme et recommences autant de boucles que tu veux. RANKED = format compétitif avec élimination progressive : 30 minutes pour boucler le 1er tour, 25 minutes pour les tours 2 à 5, puis 20 minutes à partir du 6e tour. Plus de pression, plus d'enjeu.",
  },
  {
    id: 'faq-seul',
    question: 'Je peux venir seul(e) ?',
    answer:
      "Oui. Beaucoup de participants viennent en solo. L'ambiance village est conçue pour rendre ça agréable. Tu peux aussi venir en groupe et réserver en une seule commande pour rester dans le même SAS de départ.",
  },
  {
    id: 'faq-jour-j',
    question: 'Que faut-il prévoir le jour J ?',
    answer:
      "Arrive en avance, avec une tenue adaptée, de l'eau, ton billet accessible depuis ton compte et une pièce d'identité si l'équipe en a besoin au retrait.",
  },
  {
    id: 'faq-niveau-physique',
    question: "Quel niveau physique minimum est recommandé ?",
    answer:
      "Il n'y a pas de niveau minimum exigé. En revanche, l'événement comporte des obstacles physiques — portés de bûches, franchissements, rampages. Une condition physique de base suffira pour le format OPEN.",
  },
  {
    id: 'faq-groupe',
    question: "Comment rester ensemble si on vient à plusieurs ?",
    answer:
      "Pour partir dans le même SAS, inscrivez-vous dans la même commande. Chaque participant choisit son billet individuellement, mais un seul paiement regroupe tout le groupe.",
  },
]

interface Props {
  openedFaqs: string[]
  onFaqChange: (values: string[]) => void
  isOnSale: boolean
  registerHref: string
}

export function UltraArenaFAQ({ openedFaqs, onFaqChange, isOnSale, registerHref }: Props) {
  return (
    <section id="faq" className="relative isolate overflow-hidden bg-card/50 py-14 sm:py-16">
      <div className="pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">FAQ</p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Les réponses avant de te lancer.
          </h2>
          <p className="text-sm text-muted-foreground">
            Les dernières questions avant de cliquer sur "Je prends ma place".
          </p>
        </div>

        <Accordion
          type="multiple"
          value={openedFaqs}
          onValueChange={onFaqChange}
          className="rounded-2xl border border-border/70 bg-background/85 px-4 backdrop-blur"
        >
          {FAQS.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Final CTA after FAQ — last push before they leave */}
        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            Tu as les réponses. Maintenant c'est à toi de jouer.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Inscriptions ouvertes — places limitées.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isOnSale ? (
              <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base font-semibold">
                <Link href={registerHref}>Je prends ma place</Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-8">
                <a href="#tarifs-inscription">Voir les tarifs</a>
              </Button>
            )}
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-xl px-8">
              <a href="#tarifs-inscription">Voir tous les formats en détail</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
