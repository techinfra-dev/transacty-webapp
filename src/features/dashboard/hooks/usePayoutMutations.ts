import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPayout } from '../services/payoutsService.ts'
import type { CreatePayoutPayload } from '../services/payoutsSchemas.ts'

export function useCreatePayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePayoutPayload) => createPayout(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
      ])
    },
  })
}
