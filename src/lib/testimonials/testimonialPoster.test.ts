import { describe, expect, it } from 'vitest'
import { testimonialPosterUrl } from './testimonialPoster'

describe('testimonialPosterUrl', () => {
  it('serves the matching poster through the image optimizer at a card size', () => {
    const url = testimonialPosterUrl('/videos/feedbacks/feedback-thomas.webm')
    expect(url).toMatch(/^\/_next\/image\?url=%2Fimages%2Ffeedbacks%2Fposters%2Ffeedback-thomas\.jpg&w=\d+&q=75$/)
    const width = Number(new URLSearchParams(url!.split('?')[1]).get('w'))
    expect(width).toBeLessThan(1080)
  })

  it('returns undefined when the media URL has no file name', () => {
    expect(testimonialPosterUrl('/videos/feedbacks/')).toBeUndefined()
  })
})
