import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  approveEurPayout,
  createEurPayout,
  getEurPayoutInstance,
} from '../services/eurPayoutService.ts'
import type { CreateEurPayoutPayload } from '../services/eurPayoutSchemas.ts'

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
  ])
}

export function useCreateEurPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEurPayoutPayload) => createEurPayout(payload),
    onSuccess: async () => {
      await invalidatePayoutQueries(queryClient)
    },
  })
}

export function useApproveEurPayoutMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useMutation({
    mutationFn: (transactionId: string) =>
      approveEurPayout({ transactionId, environment }),
    onSuccess: async (_data, transactionId) => {
      await Promise.all([
        invalidatePayoutQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: ['eur-payout-instance', environment, transactionId],
        }),
      ])
    },
  })
}

const terminalEurPayoutStatuses = new Set([
  'success',
  'failed',
  'cancelled',
  'rejected',
  'expired',
])

export function useEurPayoutInstanceQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useQuery({
    queryKey: ['eur-payout-instance', environment, transactionId],
    queryFn: () =>
      getEurPayoutInstance({
        transactionId: transactionId!,
        environment,
      }),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalEurPayoutStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
