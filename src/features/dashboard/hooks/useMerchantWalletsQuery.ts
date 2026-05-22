import { useQuery } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { getMerchantWallets } from '../services/walletsService.ts'

export function useMerchantWalletsQuery(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['merchant-wallets', environment],
    queryFn: () => getMerchantWallets(environment),
    enabled,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  })
}
