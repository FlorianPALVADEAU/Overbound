import { describe, expect, it } from 'vitest'
import { resolveCropRegion } from './cropRegion'

const landscape = { imageWidth: 2000, imageHeight: 1000 }

describe('resolveCropRegion', () => {
  it('takes the centred square at zoom 1', () => {
    expect(resolveCropRegion({ ...landscape, zoom: 1, centerX: 1000, centerY: 500 })).toEqual({ x: 500, y: 0, side: 1000 })
  })

  it('follows the chosen centre when zoomed in', () => {
    expect(resolveCropRegion({ ...landscape, zoom: 2, centerX: 700, centerY: 400 })).toEqual({ x: 450, y: 150, side: 500 })
  })

  it('never leaves the photo, whatever the centre', () => {
    expect(resolveCropRegion({ ...landscape, zoom: 2, centerX: -50, centerY: 5000 })).toEqual({ x: 0, y: 500, side: 500 })
    expect(resolveCropRegion({ ...landscape, zoom: 1, centerX: 9999, centerY: 500 })).toEqual({ x: 1000, y: 0, side: 1000 })
  })

  it('keeps the zoom between 1 and 4', () => {
    expect(resolveCropRegion({ ...landscape, zoom: 0.2, centerX: 1000, centerY: 500 }).side).toBe(1000)
    expect(resolveCropRegion({ ...landscape, zoom: 99, centerX: 1000, centerY: 500 }).side).toBe(250)
  })
})
