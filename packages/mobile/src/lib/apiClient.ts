import { getToken } from './authStorage';

export const apiBaseUrl: string = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface ErrorBody {
  error?: unknown;
}

function extractErrorMessage(body: unknown, status: number): string {
  if (body !== null && typeof body === 'object' && 'error' in body) {
    const { error } = body as ErrorBody;
    if (typeof error === 'string') {
      return error;
    }
    if (error !== null && typeof error === 'object') {
      return JSON.stringify(error);
    }
  }
  return `Request failed with status ${status}`;
}

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export async function throwForStatus(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  if (response.status === 401) {
    unauthorizedListeners.forEach((listener) => listener());
  }
  const body: unknown = await response.json().catch(() => null);
  throw new Error(extractErrorMessage(body, response.status));
}

export async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  await throwForStatus(response);
  return response;
}
