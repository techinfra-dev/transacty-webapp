import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listWebhookDeliveries,
  replayWebhookDelivery,
  testWebhook,
} from '../services/webhookService.ts'
import { prepareAdminStepUp } from '../utils/prepareSensitiveMutation.ts'

export function useWebhookDeliveriesQuery(enabled = true) {
  return useQuery({
    queryKey: ['portal-webhook-deliveries'],
    queryFn: () => listWebhookDeliveries({ limit: 25, offset: 0 }),
    enabled,
    staleTime: 30_000,
  })
}

export function useReplayWebhookDeliveryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId: string) => {
      const { stepUpToken } = await prepareAdminStepUp('webhook.write')
      return replayWebhookDelivery(deliveryId, { stepUpToken })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['portal-webhook-deliveries'],
      })
    },
  })
}

export function useTestWebhookMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { stepUpToken } = await prepareAdminStepUp('webhook.write')
      return testWebhook({ stepUpToken })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['portal-webhook-deliveries'],
      })
    },
  })
}
