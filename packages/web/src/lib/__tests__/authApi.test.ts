import { describe, expect, it, vi, afterEach } from 'vitest'
import { login, register } from '../authApi'
import { ApiError } from '../apiClient'

describe('authApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('register', () => {
    it('returns the token and user on success', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              token: 'token-123',
              user: { id: 'user-1', email: 'alex@example.com', name: 'Alex' },
            }),
        }),
      )

      const result = await register({
        email: 'alex@example.com',
        name: 'Alex',
        password: 'correct horse',
      })

      expect(result).toEqual({
        token: 'token-123',
        user: { id: 'user-1', email: 'alex@example.com', name: 'Alex' },
      })
    })

    it('throws with the server error message when the email is already taken', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: 'An account already exists for alex@example.com.' }),
        }),
      )

      await expect(
        register({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' }),
      ).rejects.toThrow(ApiError)
    })
  })

  describe('login', () => {
    it('returns the token and user on success', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              token: 'token-123',
              user: { id: 'user-1', email: 'alex@example.com', name: 'Alex' },
            }),
        }),
      )

      const result = await login({ email: 'alex@example.com', password: 'correct horse' })

      expect(result.token).toBe('token-123')
    })

    it('throws on invalid credentials', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid email or password.' }),
        }),
      )

      await expect(login({ email: 'alex@example.com', password: 'wrong' })).rejects.toThrow(
        'Invalid email or password.',
      )
    })
  })
})
