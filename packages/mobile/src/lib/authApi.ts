import { apiBaseUrl, authorizedFetch, throwForStatus } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateMeInput {
  name?: string;
  email?: string;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function register(input: RegisterInput): Promise<AuthResult> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  await throwForStatus(response);
  return (await response.json()) as AuthResult;
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  await throwForStatus(response);
  return (await response.json()) as AuthResult;
}

export async function logout(): Promise<void> {
  await authorizedFetch('/api/auth/logout', { method: 'POST' });
}

export async function updateMe(input: UpdateMeInput): Promise<AuthUser> {
  const response = await authorizedFetch('/api/users/me', {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return (await response.json()) as AuthUser;
}

export async function deleteMe(): Promise<void> {
  await authorizedFetch('/api/users/me', { method: 'DELETE' });
}

export async function fetchPowerSyncToken(): Promise<{ token: string }> {
  const response = await authorizedFetch('/api/auth/powersync-token', { method: 'POST' });
  return (await response.json()) as { token: string };
}
