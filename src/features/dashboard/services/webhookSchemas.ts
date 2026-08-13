import { z } from 'zod'

export const webhookGetResponseSchema = z.object({
  webhookUrl: z.string().url().nullable(),
})

export type WebhookGetResponse = z.infer<typeof webhookGetResponseSchema>

/** Contract allows clearing with either `null` or an empty string. */
export const webhookPatchRequestSchema = z.object({
  webhookUrl: z.union([z.string().url(), z.literal(''), z.null()]),
})

export type WebhookPatchRequest = z.infer<typeof webhookPatchRequestSchema>

export const webhookPatchResponseSchema = z.object({
  webhookUrl: z.string().url().nullable(),
  webhookSecret: z.string().min(1).nullable().optional(),
})

export type WebhookPatchResponse = z.infer<typeof webhookPatchResponseSchema>

export const webhookDeliveryStatusSchema = z.enum([
  'pending',
  'success',
  'failed',
  'delivered',
  'retrying',
])

export const webhookDeliveryItemSchema = z
  .object({
    id: z.string().min(1),
    eventType: z.string().min(1).optional(),
    event: z.string().min(1).optional(),
    status: z.string().min(1),
    attemptCount: z.number().optional(),
    lastError: z.string().nullable().optional(),
    createdAt: z.string().min(1).optional(),
    deliveredAt: z.string().nullable().optional(),
    nextRetryAt: z.string().nullable().optional(),
    httpStatus: z.number().nullable().optional(),
  })
  .passthrough()

export const webhookDeliveriesListResponseSchema = z.object({
  items: z.array(webhookDeliveryItemSchema),
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export const webhookDeliveryReplayResponseSchema = z
  .object({
    id: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    message: z.string().optional(),
  })
  .passthrough()

export const webhookTestResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
    deliveryId: z.string().optional(),
  })
  .passthrough()

export type WebhookDeliveryItem = z.infer<typeof webhookDeliveryItemSchema>
export type WebhookDeliveriesListResponse = z.infer<
  typeof webhookDeliveriesListResponseSchema
>
