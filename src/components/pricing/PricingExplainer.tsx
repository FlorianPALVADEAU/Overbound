"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PricingTimeline } from "@/components/events/PricingTimeline";
import { useFeaturedEvent } from "@/app/api/events/featured/featuredEventQueries";
import type { Currency } from "@/types/base.type";

export function PricingExplainer() {
  const { data, isLoading } = useFeaturedEvent();
  const event = data?.event;
  const tickets = event?.tickets ?? [];
  const priceTiers = event?.price_tiers ?? [];

  const cheapestTicket = tickets.reduce(
    (min, t) => ((t.final_price_cents ?? Infinity) < (min?.final_price_cents ?? Infinity) ? t : min),
    tickets[0],
  );

  const currency = (tickets.find((t) => t.currency)?.currency ?? "EUR") as Currency;

  return (
    <section className="w-full h-auto">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Tarification progressive
        </p>
        <h3 className="text-2xl font-bold sm:text-3xl">
          Plus tôt tu réserves, plus tu économises
        </h3>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Paliers simples, prix qui montent à l'approche de l'événement.
        </p>
      </div>

      {isLoading || !event || !cheapestTicket ? null : priceTiers.length > 0 ? (
        <PricingTimeline
          ticket={cheapestTicket}
          eventPriceTiers={priceTiers}
          currency={currency}
          eventDate={event.date}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Les tarifs de la prochaine édition seront annoncés bientôt.
        </p>
      )}

      {event ? (
        <div className="mt-8">
          <Button asChild size="lg" className="min-h-11 rounded-xl">
            <Link href={`/events/${event.slug}/register`}>Voir les tarifs et m'inscrire</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
