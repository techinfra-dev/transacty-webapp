import { useQuery } from '@tanstack/react-query'
import { getBalance } from '../services/balanceService.ts'

export function useBalanceQuery(enabled = true) {
  return useQuery({
    queryKey: ['me-balance'],
    queryFn: getBalance,
    enabled,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  })
}
