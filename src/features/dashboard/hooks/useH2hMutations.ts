import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  confirmH2hBuyerPayment,
  createH2hPayinInstance,
  getH2hPayinInstance,
} from '../services/h2hService.ts'
import type { H2hPayinCreatePayload } from '../services/h2hSchemas.ts'
import { prepareMoneyWriteHeaders } from '../utils/prepareSensitiveMutation.ts'

export function useH2hPayinInstanceQuery(
  transactionId: string | null,
  enabled = true,
) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useQuery({
    queryKey: ['portal', 'h2h-payin', environment, transactionId],
    queryFn: () => getH2hPayinInstance(transactionId as string, environment),
    enabled: Boolean(transactionId) && enabled,
  })
}

export function useCreateH2hPayinMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useMutation({
    mutationFn: async (
      payload: Omit<H2hPayinCreatePayload, 'environment'> & {
        environment?: H2hPayinCreatePayload['environment']
      },
    ) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return createH2hPayinInstance(
        { ...payload, environment: payload.environment ?? environment },
        { stepUpToken },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portal', 'h2h-payin'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useConfirmH2hBuyerPaymentMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return confirmH2hBuyerPayment(
        { transactionId, environment },
        { stepUpToken },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portal', 'h2h-payin'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
