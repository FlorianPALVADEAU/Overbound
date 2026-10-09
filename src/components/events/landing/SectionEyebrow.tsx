interface SectionEyebrowProps {
  children: React.ReactNode
}

/**
 * Shared label above a landing section's H2 (FDR-0015 §9) — same
 * text-xs/font-bold/tracking-[0.28em]/text-primary rule repeated inline
 * across every UltraArena* section before this.
 */
export function SectionEyebrow({ children }: SectionEyebrowProps) {
  return <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">{children}</p>
}
