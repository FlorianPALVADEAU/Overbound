import { describe, expect, it } from 'vitest'
import { sanitizeAdminRequestBody } from './adminRequestLogger'

describe('sanitizeAdminRequestBody', () => {
  it('parses multipart form data and logs file metadata', async () => {
    const formData = new FormData()
    formData.set('title', 'Document')
    formData.set('file', new File(['hello'], 'test.txt', { type: 'text/plain' }))

    const request = new Request('https://example.com', {
      method: 'POST',
      body: formData,
    })

    const body = await sanitizeAdminRequestBody(request)

    expect(body).toMatchObject({
      title: 'Document',
      file: {
        _type: 'file',
        name: 'test.txt',
        content_type: 'text/plain',
      },
    })
  })

  it('never returns the legacy non-loggable marker for unknown bodies', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
      },
      body: new Uint8Array([1, 2, 3]),
    })

    const body = await sanitizeAdminRequestBody(request)

    expect(body).not.toBe('[non-loggable-body]')
    if (body && typeof body === 'object') {
      expect(String((body as Record<string, unknown>)._note ?? '')).not.toContain('non-loggable')
    }
  })
})
