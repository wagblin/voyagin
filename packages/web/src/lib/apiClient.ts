import { getStoredAuth } from './authStorage'

export const apiBaseUrl: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000'

export class ApiError extends Error {}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'error' in body) {
      const { error } = body as { error: unknown }
      if (typeof error === 'string') {
        return error
      }
      return JSON.stringify(error)
    }
  } catch {
    // response body wasn't JSON — fall through to the generic message
  }
  return `Request failed with status ${response.status}.`
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function authorizedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = getStoredAuth()
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...options.headers,
      ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
  })
}
