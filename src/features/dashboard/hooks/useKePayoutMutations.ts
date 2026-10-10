import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createKePayout,
  getKePayout,
  getKePayoutFeeQuote,
} from '../services/kePayoutService.ts'
import type { CreateKePayoutPayload } from '../services/kePayoutSchemas.ts'
import { KENYA_LIVE_ONLY_ENVIRONMENT } from '../utils/kenyaMarket.ts'
import { runPayoutWrite } from '../utils/prepareSensitiveMutation.ts'

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
    queryClient.invalidateQueries({ queryKey: ['payout-approvals'] }),
  ])
}

export function useKePayoutFeeQuoteQuery(amount: string, enabled = true) {
  const trimmed = amount.trim()
  const isValid = /^\d+(\.\d{1,2})?$/.test(trimmed) && Number(trimmed) > 0

  return useQuery({
    queryKey: ['ke-payout-fee-quote', KENYA_LIVE_ONLY_ENVIRONMENT, trimmed],
    queryFn: () => getKePayoutFeeQuote(trimmed),
    enabled: enabled && isValid,
    staleTime: 15_000,
  })
}

export function useCreateKePayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateKePayoutPayload) => {
      return runPayoutWrite(
        ({ stepUpToken, pin }) =>
          createKePayout({ ...payload, pin }, { stepUpToken }),
        { description: 'Enter your payout PIN to send this KES M-Pesa payout.' },
      )
    },
    onSuccess: async () => {
      await invalidatePayoutQueries(queryClient)
    },
  })
}

const terminalKePayoutStatuses = new Set([
  'success',
  'failed',
  'cancelled',
  'canceled',
  'settled',
])

export function useKePayoutQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['ke-payout', KENYA_LIVE_ONLY_ENVIRONMENT, transactionId],
    queryFn: () => getKePayout(transactionId!),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalKePayoutStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
