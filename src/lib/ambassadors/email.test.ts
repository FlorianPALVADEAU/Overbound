import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

import {
  sendAmbassadorRewardEarnedEmail,
  sendAmbassadorRewardStatusEmail,
  sendAmbassadorWelcomeEmail,
  sendAmbassadorCodeAssignedEmail,
} from './email'

describe('ambassadors/email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null })
  })

  describe('sendAmbassadorRewardEarnedEmail', () => {
    it('sends the email with rewards list and ambassador code included', async () => {
      await sendAmbassadorRewardEarnedEmail({
        to: 'amb@example.com',
        fullName: 'Alice Martin',
        ambassadorCode: 'ALICE10',
        rewards: [
          { reward_level: 3, reward_name: 'Réduction 50%' },
          { reward_level: 4, reward_name: 'Dossard OPEN offert' },
        ],
      })

      expect(sendMock).toHaveBeenCalledTimes(1)
      const call = sendMock.mock.calls[0][0]
      expect(call.to).toBe('amb@example.com')
      expect(call.subject).toBe('Nouveau palier ambassadeur débloqué')
      expect(call.html).toContain('Alice Martin')
      expect(call.html).toContain('ALICE10')
      expect(call.html).toContain('Palier 3')
      expect(call.html).toContain('Palier 4')
      expect(call.html).toContain('Dossard OPEN offert')
    })

    it('propagates the error when Resend fails to send', async () => {
      sendMock.mockRejectedValueOnce(new Error('Resend API error'))

      await expect(
        sendAmbassadorRewardEarnedEmail({
          to: 'amb@example.com',
          fullName: null,
          ambassadorCode: null,
          rewards: [{ reward_level: 1, reward_name: 'Badge ambassadeur' }],
        }),
      ).rejects.toThrow('Resend API error')
    })
  })

  describe('sendAmbassadorRewardStatusEmail', () => {
    it('sends the status update email with reward and status label', async () => {
      await sendAmbassadorRewardStatusEmail({
        to: 'amb@example.com',
        fullName: 'Bob Dupont',
        ambassadorCode: 'BOB20',
        reward: { reward_level: 2, reward_name: 'Récompense starter' },
        statusLabel: 'Réclamée',
      })

      expect(sendMock).toHaveBeenCalledTimes(1)
      const call = sendMock.mock.calls[0][0]
      expect(call.subject).toBe('Mise à jour de ta récompense')
      expect(call.html).toContain('Bob Dupont')
      expect(call.html).toContain('BOB20')
      expect(call.html).toContain('Palier 2')
      expect(call.html).toContain('Réclamée')
    })

    it('propagates the error when Resend fails to send', async () => {
      sendMock.mockRejectedValueOnce(new Error('network error'))

      await expect(
        sendAmbassadorRewardStatusEmail({
          to: 'amb@example.com',
          fullName: null,
          ambassadorCode: null,
          reward: { reward_level: 1, reward_name: 'Badge ambassadeur' },
          statusLabel: 'Fulfilled',
        }),
      ).rejects.toThrow('network error')
    })
  })

  describe('sendAmbassadorWelcomeEmail', () => {
    it('sends the welcome email with the ambassador full name', async () => {
      await sendAmbassadorWelcomeEmail({ to: 'new@example.com', fullName: 'Claire Durand' })

      expect(sendMock).toHaveBeenCalledTimes(1)
      const call = sendMock.mock.calls[0][0]
      expect(call.to).toBe('new@example.com')
      expect(call.subject).toBe('Bienvenue dans l’équipe ambassadeur')
      expect(call.html).toContain('Claire Durand')
    })

    it('falls back to a generic greeting when fullName is missing, and propagates send errors', async () => {
      sendMock.mockRejectedValueOnce(new Error('send failed'))

      await expect(
        sendAmbassadorWelcomeEmail({ to: 'new@example.com', fullName: null }),
      ).rejects.toThrow('send failed')
    })
  })

  describe('sendAmbassadorCodeAssignedEmail', () => {
    it('sends the email containing the assigned ambassador code', async () => {
      await sendAmbassadorCodeAssignedEmail({
        to: 'coded@example.com',
        fullName: 'Damien',
        ambassadorCode: 'DAMIEN99',
      })

      expect(sendMock).toHaveBeenCalledTimes(1)
      const call = sendMock.mock.calls[0][0]
      expect(call.subject).toBe('Ton code ambassadeur est prêt')
      expect(call.html).toContain('DAMIEN99')
      expect(call.html).toContain('Damien')
    })

    it('propagates the error when Resend fails to send', async () => {
      sendMock.mockRejectedValueOnce(new Error('boom'))

      await expect(
        sendAmbassadorCodeAssignedEmail({
          to: 'coded@example.com',
          fullName: null,
          ambassadorCode: 'CODE1',
        }),
      ).rejects.toThrow('boom')
    })
  })
})
