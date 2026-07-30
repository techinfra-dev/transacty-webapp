import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrPayout } from '../services/brPayoutService.ts'
import type { CreateBrPayoutPayload } from '../services/brPayoutSchemas.ts'
import { prepareMoneyWriteHeaders } from '../utils/prepareSensitiveMutation.ts'

export function useCreateBrPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateBrPayoutPayload) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return createBrPayout(payload, { stepUpToken })
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
