import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  createCpgPayout,
  getCpgPayoutRequest,
} from '../services/cpgPayoutService.ts'
import type { CreateCpgPayoutPayload } from '../services/cpgPayoutSchemas.ts'

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
  ])
}

export function useCreateCpgPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCpgPayoutPayload) => createCpgPayout(payload),
    onSuccess: async () => {
      await invalidatePayoutQueries(queryClient)
    },
  })
}

const terminalCpgPayoutStatuses = new Set(['success', 'failed'])

export function useCpgPayoutRequestQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useQuery({
    queryKey: ['cpg-payout-request', environment, transactionId],
    queryFn: () =>
      getCpgPayoutRequest({
        transactionId: transactionId!,
        environment,
      }),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalCpgPayoutStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
