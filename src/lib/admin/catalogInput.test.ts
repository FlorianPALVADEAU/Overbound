import { describe, expect, it } from 'vitest'
import { obstacleInputSchema, raceInputSchema } from './catalogInput'

const validRace = {
  name: 'Ultra Arena',
  type: 'obstacle',
  target_public: 'expert',
  distance_km: '8.5',
  difficulty: '7',
  obstacle_ids: ['4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'],
}

describe('raceInputSchema', () => {
  it('accepts a valid race and reads numeric strings', () => {
    const parsed = raceInputSchema.parse(validRace)
    expect(parsed.distance_km).toBe(8.5)
    expect(parsed.difficulty).toBe(7)
    expect(parsed.is_universal).toBe(false)
  })

  it('defaults difficulty to 5 when absent, as the form always did', () => {
    const { difficulty: _omitted, ...withoutDifficulty } = validRace
    expect(raceInputSchema.parse(withoutDifficulty).difficulty).toBe(5)
  })

  it('refuses a non-numeric distance that used to be stored as NaN', () => {
    expect(raceInputSchema.safeParse({ ...validRace, distance_km: 'abc' }).success).toBe(false)
  })

  it('refuses a zero or negative distance', () => {
    expect(raceInputSchema.safeParse({ ...validRace, distance_km: 0 }).success).toBe(false)
  })

  it('refuses a difficulty outside 1 to 10', () => {
    expect(raceInputSchema.safeParse({ ...validRace, difficulty: 11 }).success).toBe(false)
  })

  it('refuses an unknown race type', () => {
    expect(raceInputSchema.safeParse({ ...validRace, type: 'bikes' }).success).toBe(false)
  })

  it('refuses an obstacle id that is not a uuid', () => {
    expect(raceInputSchema.safeParse({ ...validRace, obstacle_ids: ['not-a-uuid'] }).success).toBe(false)
  })
})

describe('obstacleInputSchema', () => {
  const validObstacle = { name: 'Mur', type: 'force', difficulty: '4', penalty: '' }

  it('accepts a valid obstacle and turns blank optional text into null', () => {
    const parsed = obstacleInputSchema.parse(validObstacle)
    expect(parsed.difficulty).toBe(4)
    expect(parsed.penalty).toBeNull()
  })

  it('refuses an unknown obstacle type', () => {
    expect(obstacleInputSchema.safeParse({ ...validObstacle, type: 'magie' }).success).toBe(false)
  })

  it('refuses a difficulty of 0', () => {
    expect(obstacleInputSchema.safeParse({ ...validObstacle, difficulty: 0 }).success).toBe(false)
  })
})
