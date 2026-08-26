import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPyusdPaymentIntent,
  getPyusdPaymentIntent,
} from '../services/pyusdPaymentIntentService.ts'
import type { CreatePyusdPaymentIntentPayload } from '../services/pyusdPaymentIntentSchemas.ts'
import { prepareMoneyWriteHeaders } from '../utils/prepareSensitiveMutation.ts'

function invalidatePyusdQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['pyusd-payment-intent'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
  ])
}

export function useCreatePyusdPaymentIntentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Omit<CreatePyusdPaymentIntentPayload, 'environment'>,
    ) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return createPyusdPaymentIntent(
        { ...payload, environment: 'live' },
        { stepUpToken },
      )
    },
    onSuccess: async () => {
      await invalidatePyusdQueries(queryClient)
    },
  })
}

const terminalStatuses = new Set([
  'success',
  'succeeded',
  'completed',
  'failed',
  'expired',
  'cancelled',
  'canceled',
])

export function usePyusdPaymentIntentQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['pyusd-payment-intent', 'live', transactionId],
    queryFn: () => getPyusdPaymentIntent(transactionId!),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
