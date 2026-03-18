import { z } from 'zod'

export const apiKeyItemSchema = z.object({
  id: z.string().min(1),
  keyMasked: z.string().min(1),
  environment: z.string().min(1),
  scopes: z.string().min(1),
  status: z.string().min(1),
  createdAt: z.string().min(1),
})

export const apiKeysResponseSchema = z.object({
  items: z.array(apiKeyItemSchema),
})

export type ApiKeyItem = z.infer<typeof apiKeyItemSchema>
export type ApiKeysResponse = z.infer<typeof apiKeysResponseSchema>
