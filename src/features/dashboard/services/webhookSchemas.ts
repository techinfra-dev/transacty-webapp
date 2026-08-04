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
