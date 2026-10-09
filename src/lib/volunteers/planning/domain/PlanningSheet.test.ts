import { describe, expect, it } from 'vitest'
import { assignment } from '../testing/builders'
import { PlanningSheet } from './PlanningSheet'
import { zoneCatalog } from './Zone'

const sheet = new PlanningSheet(zoneCatalog)

describe('PlanningSheet', () => {
  it('lays out RESP, then AIDE, then members, one column per zone', () => {
    const [morning] = sheet.blocks([
      assignment(null, 'morning', 'accueil', { role: 'resp', name: 'Cécile' }),
      assignment(null, 'morning', 'accueil', { role: 'aide', name: 'Cartigny' }),
      assignment('1', 'morning', 'accueil', { name: 'Zoé' }),
      assignment('2', 'morning', 'accueil', { name: 'Alex' }),
      assignment('3', 'morning', 'ravito', { name: 'Paul' }),
    ])
    const accueil = morning.header.indexOf('Accueil')
    const ravito = morning.header.indexOf('Ravito')
    expect(morning.title).toBe('MATIN - RANKED - 07:00 à 12:00')
    expect(morning.rows.map((row) => row[accueil])).toEqual(['RESP - Cécile', 'AIDE - Cartigny', 'Alex', 'Zoé'])
    expect(morning.rows.map((row) => row[ravito])).toEqual(['', '', 'Paul', ''])
    expect(morning.leadRowCount).toBe(2)
  })

  it('keeps the two shifts apart', () => {
    const [morning, afternoon] = sheet.blocks([assignment('1', 'afternoon', 'consignes', { name: 'Paul' })])
    expect(morning.rows).toEqual([])
    expect(afternoon.title).toBe('APRÈS-MIDI - OPEN - 12:00 à 19h')
    expect(afternoon.rows[0]).toContain('Paul')
  })

  it('returns two empty blocks when nobody is assigned', () => {
    const blocks = sheet.blocks([])
    expect(blocks).toHaveLength(2)
    expect(blocks.every((block) => block.rows.length === 0)).toBe(true)
  })
})
