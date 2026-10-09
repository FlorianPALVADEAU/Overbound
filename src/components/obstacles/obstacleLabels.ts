export const OBSTACLE_TYPES: Record<string, string> = {
  climbing: 'Escalade',
  jumping: 'Saut',
  crawling: 'Ramper',
  carrying: 'Porter',
  balance: 'Équilibre',
  strength: 'Force',
  endurance: 'Endurance',
  agility: 'Agilité',
  water: 'Aquatique',
  technical: 'Technique',
  mental: 'Mental',
  team: 'Équipe',
}

export const difficultyLabel = (difficulty: number) => {
  if (difficulty <= 3) return 'Facile'
  if (difficulty <= 6) return 'Intermédiaire'
  return 'Expert'
}
