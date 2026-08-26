import { useQuery } from '@tanstack/react-query'
import { fetchUsdFxRates } from '../services/fxRatesService.ts'

export function useUsdFxRatesQuery(enabled = true) {
  return useQuery({
    queryKey: ['fx-rates', 'usd'],
    queryFn: fetchUsdFxRates,
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
