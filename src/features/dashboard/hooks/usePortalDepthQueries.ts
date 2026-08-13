import { useQuery } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { getMoneyOverview } from '../services/moneyOverviewService.ts'
import { getMerchantFees } from '../services/feesService.ts'
import { getSecurityOverview } from '../services/securityOverviewService.ts'

export function useMoneyOverviewQuery(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useQuery({
    queryKey: ['portal', 'money-overview', environment],
    queryFn: () => getMoneyOverview(environment),
    enabled,
    staleTime: 30_000,
  })
}

export function useMerchantFeesQuery(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useQuery({
    queryKey: ['portal', 'fees', environment],
    queryFn: () => getMerchantFees(environment),
    enabled,
    staleTime: 60_000,
  })
}

export function useSecurityOverviewQuery(enabled = true) {
  return useQuery({
    queryKey: ['portal', 'security-overview'],
    queryFn: getSecurityOverview,
    enabled,
    staleTime: 30_000,
  })
}
