import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createKeCollect, getKeCollect } from '../services/keCollectService.ts'
import type { CreateKeCollectPayload } from '../services/keCollectSchemas.ts'
import { KENYA_LIVE_ONLY_ENVIRONMENT } from '../utils/kenyaMarket.ts'
import { prepareMoneyWriteHeaders } from '../utils/prepareSensitiveMutation.ts'

export function useCreateKeCollectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      payload: Omit<CreateKeCollectPayload, 'environment'> & {
        environment?: CreateKeCollectPayload['environment']
      },
    ) => {
      const { stepUpToken } = await prepareMoneyWriteHeaders()
      return createKeCollect(
        {
          ...payload,
          environment: payload.environment ?? KENYA_LIVE_ONLY_ENVIRONMENT,
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

const terminalKeCollectStatuses = new Set([
  'success',
  'failed',
  'cancelled',
  'canceled',
  'settled',
  'expired',
])

export function useKeCollectQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['ke-collect', KENYA_LIVE_ONLY_ENVIRONMENT, transactionId],
    queryFn: () => getKeCollect(transactionId!),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalKeCollectStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
