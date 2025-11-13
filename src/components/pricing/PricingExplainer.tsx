"use client";

type Color = "emerald" | "blue" | "amber" | "red";

export function PricingExplainer() {
  // Paliers de prix (compact)
  const tiers = [
    {
      name: "Super Early Bird",
      date: "Dès ouverture",
      price: "45€",
      discount: "-40%",
      color: "emerald",
    },
    {
      name: "Early Bird",
      date: "2 semaines après l'ouverture",
      price: "55€",
      discount: "-27%",
      color: "blue",
    },
    {
      name: "Standard",
      date: "2 mois après l'ouverture",
      price: "65€",
      discount: "-13%",
      color: "amber",
    },
    {
      name: "Plein tarif",
      date: "Plus de 2 mois après l'ouverture",
      price: "75€",
      discount: "0%",
      color: "red",
    },
  ] as const;

  const dotBg: Record<Color, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-rose-500",
  };
  // Simplified: keep only dot colors for a light UI

  return (
    <section className="w-full h-auto">
      {/* En-tête léger */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">
          Plus tôt tu réserves, plus tu économises
        </h3>
        <p className="text-sm text-muted-foreground">
          Paliers simples, prix qui montent à l’approche de l’événement.{" "}
          <strong>*</strong>
        </p>
      </div>

      {/* Timeline compacte — Desktop (>= sm) */}
      <div className="relative hidden py-10 sm:block">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-border" />

        <div className="relative flex items-center justify-between">
          {tiers.map((tier, index) => {
            const color = tier.color as Color;
            return (
              <div
                key={index}
                className="relative flex flex-1 flex-col items-center"
              >
                {/* Date au-dessus */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-center">
                  <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                    {tier.date}
                  </span>
                </div>

                {/* Point */}
                <div className={`z-10 h-3 w-3 rounded-full ${dotBg[color]}`} />

                {/* Nom du palier */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-xs font-semibold">{tier.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline compacte — Mobile (< sm) */}
      <div className="relative sm:hidden">
        {/* Ligne verticale */}
        <div className="absolute left-2 top-0 bottom-0 border-l border-dashed border-border" />

        <div className="relative flex flex-col">
          {tiers.map((tier, index) => {
            const color = tier.color as Color;
            return (
              <div key={index} className="relative pl-8 py-4">
                {/* Point */}
                <span
                  className={`absolute left-1 top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full ${dotBg[color]}`}
                />

                {/* Textes */}
                <div className="text-sm font-semibold leading-5">
                  {tier.name}
                </div>
                <div className="text-xs text-muted-foreground">{tier.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende très concise */}
      <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <strong>*</strong>
        <span>
          Places limitées par palier — n’attends pas le dernier moment.
        </span>
      </div>
    </section>
  );
}
