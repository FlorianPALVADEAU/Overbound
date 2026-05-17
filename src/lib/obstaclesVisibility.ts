const HIDDEN_OBSTACLE_NAMES = new Set([
  'escalade de filet',
])

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

export function isPublicObstacleVisible(name: string | null | undefined) {
  if (!name) return true
  return !HIDDEN_OBSTACLE_NAMES.has(normalize(name))
}

