import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Custom design-system tokens (src/app/globals.css). Without this, tailwind-merge
// reads `text-display-md` as a color and drops it next to `text-primary`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-xl", "display-lg", "display-md", "title", "lead", "eyebrow", "label"] }],
      tracking: [{ tracking: ["eyebrow", "label"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
