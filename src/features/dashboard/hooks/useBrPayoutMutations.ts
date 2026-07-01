import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrPayout } from '../services/brPayoutService.ts'
import type { CreateBrPayoutPayload } from '../services/brPayoutSchemas.ts'

export function useCreateBrPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBrPayoutPayload) => createBrPayout(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
      ])
    },
  })
}
