import { apiBaseUrl } from './apiClient';

export interface HealthStatus {
  status: 'ok';
}

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${apiBaseUrl}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return (await response.json()) as HealthStatus;
}
