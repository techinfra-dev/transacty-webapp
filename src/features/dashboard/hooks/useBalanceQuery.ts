import { useQuery } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { getBalance } from '../services/balanceService.ts'

export function useBalanceQuery(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['me-balance', environment],
    queryFn: () => getBalance(environment),
    enabled,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  })
}
