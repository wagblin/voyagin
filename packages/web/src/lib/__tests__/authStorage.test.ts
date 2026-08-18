import { describe, expect, it, beforeEach } from 'vitest'
import { clearAuth, getStoredAuth, storeAuth } from '../authStorage'

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing was stored', () => {
    expect(getStoredAuth()).toBeNull()
  })

  it('returns the token and user that were stored', () => {
    storeAuth('token-123', { id: 'user-1', email: 'alex@example.com', name: 'Alex' })

    expect(getStoredAuth()).toEqual({
      token: 'token-123',
      user: { id: 'user-1', email: 'alex@example.com', name: 'Alex' },
    })
  })

  it('returns null after clearing', () => {
    storeAuth('token-123', { id: 'user-1', email: 'alex@example.com', name: 'Alex' })
    clearAuth()

    expect(getStoredAuth()).toBeNull()
  })
})
