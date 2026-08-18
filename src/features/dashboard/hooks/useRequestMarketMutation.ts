import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestMarketActivation } from '../services/marketsService.ts'
import type { MerchantMarket } from '../services/marketSchemas.ts'
import {
  BANGLADESH_RAIL_PAUSE_COPY,
  isBangladeshRailPausedForMarket,
} from '../utils/bangladeshRailPause.ts'

export function useRequestMarketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (market: MerchantMarket) => {
      if (isBangladeshRailPausedForMarket(market)) {
        throw new Error(BANGLADESH_RAIL_PAUSE_COPY)
      }
      return requestMarketActivation(market)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['merchant-markets'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
      ])
    },
  })
}
