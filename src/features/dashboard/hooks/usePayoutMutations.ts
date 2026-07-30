import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPayout } from '../services/payoutsService.ts'
import type { CreatePayoutPayload } from '../services/payoutsSchemas.ts'
import { prepareMoneyWriteHeaders } from '../utils/prepareSensitiveMutation.ts'

export function useCreatePayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreatePayoutPayload) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return createPayout(payload, { stepUpToken })
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
