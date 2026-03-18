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

export const apiKeyEnvironmentSchema = z.enum(['test', 'live'])

export const createApiKeyPayloadSchema = z.object({
  environment: apiKeyEnvironmentSchema.optional(),
})

export const createApiKeyResponseSchema = z.object({
  id: z.string().min(1),
  apiKey: z.string().min(1),
  secret: z.string().min(1),
  environment: apiKeyEnvironmentSchema,
  scopes: z.string().min(1),
  message: z.string().min(1),
})

export const revokeApiKeyResponseSchema = z.object({
  ok: z.boolean(),
})

export type ApiKeyItem = z.infer<typeof apiKeyItemSchema>
export type ApiKeysResponse = z.infer<typeof apiKeysResponseSchema>
export type ApiKeyEnvironment = z.infer<typeof apiKeyEnvironmentSchema>
export type CreateApiKeyPayload = z.infer<typeof createApiKeyPayloadSchema>
export type CreateApiKeyResponse = z.infer<typeof createApiKeyResponseSchema>
export type RevokeApiKeyResponse = z.infer<typeof revokeApiKeyResponseSchema>
