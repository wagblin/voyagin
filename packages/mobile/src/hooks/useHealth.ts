import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchHealth, type HealthStatus } from '../lib/healthApi';

export function useHealth(): UseQueryResult<HealthStatus> {
  return useQuery({ queryKey: ['health'], queryFn: fetchHealth });
}
