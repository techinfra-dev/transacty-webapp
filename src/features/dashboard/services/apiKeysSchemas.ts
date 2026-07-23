import { z } from 'zod'

export const API_KEY_SCOPE_OPTIONS = [
  { value: 'payin:create', label: 'Payin · create' },
  { value: 'payout:create', label: 'Payout · create' },
  { value: 'balance:read', label: 'Balance · read' },
  { value: 'wallets:create', label: 'Wallets · create' },
  { value: 'wallets:read', label: 'Wallets · read' },
  { value: 'transfer:create', label: 'Transfer · create' },
  { value: 'internal_transfer:create', label: 'Internal transfer · create' },
  { value: 'tylt:internal_transfer', label: 'TYLT · internal transfer' },
  { value: '*', label: 'All scopes (*)' },
] as const

export const apiKeyScopeSchema = z.enum([
  '*',
  'payin:create',
  'payout:create',
  'balance:read',
  'wallets:create',
  'wallets:read',
  'transfer:create',
  'internal_transfer:create',
  'tylt:internal_transfer',
])

export const apiKeyItemSchema = z.object({
  id: z.string().min(1),
  keyMasked: z.string().min(1),
  environment: z.string().min(1),
  scopes: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  status: z.string().min(1),
  createdAt: z.string().min(1),
})

export const apiKeysResponseSchema = z.object({
  items: z.array(apiKeyItemSchema),
})

export const apiKeyEnvironmentSchema = z.enum(['test', 'live'])

export const createApiKeyPayloadSchema = z.object({
  environment: apiKeyEnvironmentSchema,
  scopes: z.array(apiKeyScopeSchema).min(1, 'Select at least one scope.'),
})

export const createApiKeyResponseSchema = z.object({
  id: z.string().min(1),
  apiKey: z.string().min(1),
  secret: z.string().min(1),
  environment: apiKeyEnvironmentSchema,
  scopes: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  message: z.string().min(1),
})

export const revokeApiKeyResponseSchema = z.object({
  ok: z.boolean(),
})

export type ApiKeyScope = z.infer<typeof apiKeyScopeSchema>
export type ApiKeyItem = z.infer<typeof apiKeyItemSchema>
export type ApiKeysResponse = z.infer<typeof apiKeysResponseSchema>
export type ApiKeyEnvironment = z.infer<typeof apiKeyEnvironmentSchema>
export type CreateApiKeyPayload = z.infer<typeof createApiKeyPayloadSchema>
export type CreateApiKeyResponse = z.infer<typeof createApiKeyResponseSchema>
export type RevokeApiKeyResponse = z.infer<typeof revokeApiKeyResponseSchema>

export function normalizeApiKeyScopes(
  scopes: string | string[],
): string[] {
  if (Array.isArray(scopes)) {
    return scopes.map((scope) => scope.trim()).filter(Boolean)
  }
  return scopes
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean)
}
