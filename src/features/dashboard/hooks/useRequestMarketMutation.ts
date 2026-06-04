import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestMarketActivation } from '../services/marketsService.ts'
import type { MerchantMarket } from '../services/marketSchemas.ts'

export function useRequestMarketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (market: MerchantMarket) => requestMarketActivation(market),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['merchant-markets'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
      ])
    },
  })
}
