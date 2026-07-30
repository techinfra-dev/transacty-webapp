import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getWebhook, patchWebhook } from '../services/webhookService.ts'
import type { WebhookPatchRequest } from '../services/webhookSchemas.ts'
import { prepareAdminStepUp } from '../utils/prepareSensitiveMutation.ts'

export function useWebhookQuery(enabled = true) {
  return useQuery({
    queryKey: ['portal-webhook'],
    queryFn: getWebhook,
    enabled,
    staleTime: 60_000,
  })
}

export function useUpdateWebhookMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: WebhookPatchRequest) => {
      const { stepUpToken } = await prepareAdminStepUp('webhook.write')
      return patchWebhook(payload, { stepUpToken })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portal-webhook'] })
    },
  })
}
