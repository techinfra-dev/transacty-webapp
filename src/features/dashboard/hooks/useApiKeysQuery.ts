import { useQuery } from '@tanstack/react-query'
import { getApiKeys } from '../services/apiKeysService.ts'

export function useApiKeysQuery(enabled = true) {
  return useQuery({
    queryKey: ['api-keys-list'],
    queryFn: getApiKeys,
    enabled,
    staleTime: 60_000,
  })
}
