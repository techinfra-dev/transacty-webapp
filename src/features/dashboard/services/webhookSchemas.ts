import { z } from 'zod'

export const webhookGetResponseSchema = z.object({
  webhookUrl: z.string().url().nullable(),
})

export type WebhookGetResponse = z.infer<typeof webhookGetResponseSchema>

export const webhookPatchRequestSchema = z.object({
  webhookUrl: z.union([z.string().url(), z.null()]),
})

export type WebhookPatchRequest = z.infer<typeof webhookPatchRequestSchema>

export const webhookPatchResponseSchema = z.object({
  webhookUrl: z.string().url().nullable(),
  webhookSecret: z.string().min(1).nullable().optional(),
})

export type WebhookPatchResponse = z.infer<typeof webhookPatchResponseSchema>
