export interface StoredUser {
  id: string
  email: string
  name: string
}

export interface StoredAuth {
  token: string
  user: StoredUser
}

const STORAGE_KEY = 'voyagin.auth'

export function storeAuth(token: string, user: StoredUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
}

export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  return JSON.parse(raw) as StoredAuth
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
}
