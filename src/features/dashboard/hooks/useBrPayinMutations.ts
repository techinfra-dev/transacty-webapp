import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { createBrPixPayin } from '../services/brPayinService.ts'
import type { CreateBrPixPayinPayload } from '../services/brPayinSchemas.ts'
import { prepareMoneyWriteHeaders } from '../utils/prepareSensitiveMutation.ts'

export function useCreateBrPixPayinMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useMutation({
    mutationFn: async (
      payload: Omit<CreateBrPixPayinPayload, 'environment' | 'paymentMethodCode'> & {
        environment?: CreateBrPixPayinPayload['environment']
      },
    ) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return createBrPixPayin(
        {
          ...payload,
          environment: payload.environment ?? environment,
          paymentMethodCode: 'PIX',
        },
        { stepUpToken },
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
