export function estimateReadingTime(text: string | undefined): { minutes: number; words: number } {
  if (!text) return { minutes: 0, words: 0 }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return { minutes, words }
}

