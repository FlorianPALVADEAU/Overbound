import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextEditionTeaser } from './NextEditionTeaser'

const LAST_EVENT = {
  id: 'evt-1',
  slug: 'ultra-arena-2026',
  title: 'Ultra Arena 2026',
  date: '2026-09-12T08:00:00+00:00',
  location: 'SQY',
  status: 'completed',
  photos_url: 'https://photos.example.com/2026',
}

const submit = (email: string) => {
  fireEvent.change(screen.getByLabelText('Ton adresse email'), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: /Me prévenir/ }))
}

describe('NextEditionTeaser', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('posts the email to the last event and confirms', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<NextEditionTeaser lastEvent={LAST_EVENT} />)
    submit('runner@example.com')
    await waitFor(() => expect(screen.getByText(/on te prévient dès l'ouverture/)).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/ultra-arena-2026/notify',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'runner@example.com' }) }),
    )
  })

  it('shows the API error and keeps the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Trop de requêtes' }) }))
    render(<NextEditionTeaser lastEvent={LAST_EVENT} />)
    submit('runner@example.com')
    await waitFor(() => expect(screen.getByText('Trop de requêtes')).toBeInTheDocument())
    expect(screen.getByLabelText('Ton adresse email')).toBeInTheDocument()
  })

  it('hides the form when no past event exists but keeps the teaser copy', () => {
    render(<NextEditionTeaser lastEvent={null} />)
    expect(screen.queryByLabelText('Ton adresse email')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/On prépare la suite/i)
  })
})
