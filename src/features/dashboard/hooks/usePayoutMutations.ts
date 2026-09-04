import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPayout } from '../services/payoutsService.ts'
import type { CreatePayoutPayload } from '../services/payoutsSchemas.ts'
import { runPayoutWrite } from '../utils/prepareSensitiveMutation.ts'

export function useCreatePayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreatePayoutPayload) => {
      return runPayoutWrite(
        ({ stepUpToken, pin }) =>
          createPayout({ ...payload, pin }, { stepUpToken }),
        { description: 'Enter your payout PIN to send this payout.' },
      )
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
      ])
    },
  })
}
