/**
 * Placeholder figures for the charts that need race timing, which is not
 * recorded yet. They only ever render blurred behind a "Bientôt" overlay
 * (see ComingSoon) and are never presented as the user's real data.
 */

export const TEASER_KM_CUMULATIVE = [
  { label: 'Éd. 1', km: 12 },
  { label: 'Éd. 2', km: 26 },
  { label: 'Éd. 3', km: 44 },
  { label: 'Éd. 4', km: 70 },
  { label: 'Éd. 5', km: 96 },
  { label: 'Éd. 6', km: 128 },
]

export const TEASER_LAPS_PER_EDITION = [
  { label: 'Éd. 1', laps: 6 },
  { label: 'Éd. 2', laps: 7 },
  { label: 'Éd. 3', laps: 9 },
  { label: 'Éd. 4', laps: 13 },
  { label: 'Éd. 5', laps: 13 },
  { label: 'Éd. 6', laps: 16 },
]

/** Pace in minutes per km for each lap of a race. */
export const TEASER_PACE_PER_LAP = [6.1, 5.9, 6.0, 6.3, 6.6, 6.4, 6.8, 6.5, 6.2, 6.0].map((pace, index) => ({
  label: `T${index + 1}`,
  pace,
}))

export const TEASER_OBSTACLE_SKILLS = [
  { skill: 'Force', value: 78 },
  { skill: 'Équilibre', value: 62 },
  { skill: 'Grimpe', value: 85 },
  { skill: 'Agilité', value: 70 },
  { skill: 'Endurance', value: 90 },
  { skill: 'Technique', value: 66 },
]

export const TEASER_GROUP_GOAL_KM = 500
export const TEASER_GROUP_KM_CUMULATIVE = [
  { label: 'Éd. 1', km: 40 },
  { label: 'Éd. 2', km: 95 },
  { label: 'Éd. 3', km: 170 },
  { label: 'Éd. 4', km: 260 },
  { label: 'Éd. 5', km: 365 },
]

export const TEASER_LEADERBOARD = [
  { name: 'Camille', km: 148, laps: 74 },
  { name: 'Toi', km: 128, laps: 64, isSelf: true },
  { name: 'Théo', km: 112, laps: 56 },
  { name: 'Léa', km: 96, laps: 48 },
  { name: 'Sam', km: 74, laps: 37 },
]

export const TEASER_CHALLENGE = {
  title: '200 tours à plusieurs',
  description: 'Cumulez 200 tours avant la fin du mois pour débloquer le badge Tribu.',
  done: 134,
  target: 200,
  daysLeft: 12,
}

export const TEASER_CHALLENGE_CONTRIBUTORS = [
  { name: 'Camille', km: 54, laps: 27 },
  { name: 'Toi', km: 46, laps: 23, isSelf: true },
  { name: 'Théo', km: 38, laps: 19 },
]
