import { apiFetch, authorizedFetch } from './apiClient'
import type { StoredUser } from './authStorage'

export interface AuthResponse {
  token: string
  user: StoredUser
}

export interface RegisterInput {
  email: string
  name: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface UpdateMeInput {
  name?: string
  email?: string
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logout(): Promise<void> {
  return authorizedFetch<void>('/api/auth/logout', { method: 'POST' })
}

export function updateMe(input: UpdateMeInput): Promise<StoredUser> {
  return authorizedFetch<StoredUser>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteMe(): Promise<void> {
  return authorizedFetch<void>('/api/users/me', { method: 'DELETE' })
}
