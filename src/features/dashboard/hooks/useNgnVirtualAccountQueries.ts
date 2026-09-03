import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNgnVirtualAccount,
  provisionNgnVirtualAccount,
} from '../services/ngnVirtualAccountService.ts'
import {
  getNgnVirtualAccountStatus,
  type NgnBvnFormPayload,
} from '../services/ngnVirtualAccountSchemas.ts'
import { NIGERIA_LIVE_ONLY_ENVIRONMENT } from '../utils/nigeriaMarket.ts'
import { prepareMoneyWriteHeaders } from '../utils/prepareSensitiveMutation.ts'

export const NGN_VIRTUAL_ACCOUNT_QUERY_KEY = [
  'ngn-virtual-account',
  NIGERIA_LIVE_ONLY_ENVIRONMENT,
] as const

export function useNgnVirtualAccountQuery(enabled = true) {
  return useQuery({
    queryKey: NGN_VIRTUAL_ACCOUNT_QUERY_KEY,
    queryFn: getNgnVirtualAccount,
    enabled,
    refetchInterval: (query) => {
      const account = query.state.data
      if (!account) {
        return false
      }
      // BVN check or account creation still running upstream.
      return getNgnVirtualAccountStatus(account) === 'pending' ? 5_000 : false
    },
  })
}

/**
 * Provisions the permanent virtual account from BVN Basic details.
 * The result is written straight into the virtual-account query so callers can
 * `reset()` this mutation immediately and drop the BVN from React Query state.
 */
export function useProvisionNgnVirtualAccountMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: NgnBvnFormPayload) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return provisionNgnVirtualAccount(
        { ...payload, environment: NIGERIA_LIVE_ONLY_ENVIRONMENT },
        { stepUpToken },
      )
    },
    onSuccess: async (account) => {
      queryClient.setQueryData(NGN_VIRTUAL_ACCOUNT_QUERY_KEY, account)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
      ])
    },
  })
}
