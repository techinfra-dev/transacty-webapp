import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getWebhook, patchWebhook } from '../services/webhookService.ts'
import type { WebhookPatchRequest } from '../services/webhookSchemas.ts'

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
    mutationFn: (payload: WebhookPatchRequest) => patchWebhook(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portal-webhook'] })
    },
  })
}
