import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { apiBaseUrl } from '@/lib/apiClient'

export interface HealthStatus {
  status: 'ok'
}

async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${apiBaseUrl}/api/health`)
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
  return (await response.json()) as HealthStatus
}

export function useHealth(): UseQueryResult<HealthStatus> {
  return useQuery({ queryKey: ['health'], queryFn: fetchHealth })
}
