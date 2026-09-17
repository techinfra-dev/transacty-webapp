import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrPayout } from '../services/brPayoutService.ts'
import type { CreateBrPayoutPayload } from '../services/brPayoutSchemas.ts'
import { runPayoutWrite } from '../utils/prepareSensitiveMutation.ts'

export function useCreateBrPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateBrPayoutPayload) => {
      return runPayoutWrite(
        ({ stepUpToken, pin }) =>
          createBrPayout({ ...payload, pin }, { stepUpToken }),
        { description: 'Enter your payout PIN to send this PIX payout.' },
      )
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['payout-approvals'] }),
      ])
    },
  })
}
