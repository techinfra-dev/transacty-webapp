import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createKeStablecoinPayout,
  createKeStablecoinQuote,
  getKeStablecoinPayout,
} from '../services/keStablecoinPayoutService.ts'
import type {
  CreateKeStablecoinPayoutPayload,
  CreateKeStablecoinQuotePayload,
} from '../services/keStablecoinPayoutSchemas.ts'
import { KENYA_LIVE_ONLY_ENVIRONMENT } from '../utils/kenyaMarket.ts'
import { runPayoutWrite } from '../utils/prepareSensitiveMutation.ts'

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
  ])
}

export function useCreateKeStablecoinQuoteMutation() {
  return useMutation({
    mutationFn: (payload: CreateKeStablecoinQuotePayload) =>
      createKeStablecoinQuote(payload),
  })
}

export function useCreateKeStablecoinPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateKeStablecoinPayoutPayload) => {
      return runPayoutWrite(
        ({ stepUpToken, pin }) =>
          createKeStablecoinPayout({ ...payload, pin }, { stepUpToken }),
        {
          description:
            'Enter your payout PIN to send this KES → stablecoin payout.',
        },
      )
    },
    onSuccess: async () => {
      await invalidatePayoutQueries(queryClient)
    },
  })
}

const terminalKeStablecoinStatuses = new Set([
  'success',
  'failed',
  'cancelled',
  'canceled',
  'settled',
])

export function useKeStablecoinPayoutQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['ke-stablecoin-payout', KENYA_LIVE_ONLY_ENVIRONMENT, transactionId],
    queryFn: () => getKeStablecoinPayout(transactionId!),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.needsManualReview) {
        return false
      }
      const status = data?.status?.trim().toLowerCase()
      if (status && terminalKeStablecoinStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
