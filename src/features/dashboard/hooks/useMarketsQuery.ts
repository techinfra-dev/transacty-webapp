import { useQuery } from '@tanstack/react-query'
import { getMarkets } from '../services/marketsService.ts'

export function useMarketsQuery(enabled = true) {
  return useQuery({
    queryKey: ['merchant-markets'],
    queryFn: getMarkets,
    enabled,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  })
}
