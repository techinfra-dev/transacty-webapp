import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  createNuvionPayout,
  getNuvionPayout,
} from '../services/nuvionPayoutService.ts'
import type { CreateNuvionPayoutPayload } from '../services/nuvionPayoutSchemas.ts'
import { runPayoutWrite } from '../utils/prepareSensitiveMutation.ts'

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
    queryClient.invalidateQueries({ queryKey: ['payout-approvals'] }),
  ])
}

export function useCreateNuvionPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateNuvionPayoutPayload) => {
      return runPayoutWrite(
        ({ stepUpToken, pin }) =>
          createNuvionPayout({ ...payload, pin }, { stepUpToken }),
        { description: 'Enter your payout PIN to send this Nuvion payout.' },
      )
    },
    onSuccess: async () => {
      await invalidatePayoutQueries(queryClient)
    },
  })
}

const terminalNuvionPayoutStatuses = new Set([
  'success',
  'failed',
  'cancelled',
  'canceled',
  'settled',
])

export function useNuvionPayoutQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['nuvion-payout', environment, transactionId],
    queryFn: () => getNuvionPayout(transactionId!, environment),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalNuvionPayoutStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
