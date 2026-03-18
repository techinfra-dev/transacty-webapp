import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiKey, getApiKeys, revokeApiKey } from '../services/apiKeysService.ts'
import type { CreateApiKeyPayload } from '../services/apiKeysSchemas.ts'

export function useApiKeysQuery(enabled = true) {
  return useQuery({
    queryKey: ['api-keys-list'],
    queryFn: getApiKeys,
    enabled,
    staleTime: 60_000,
  })
}

export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => createApiKey(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys-list'] })
    },
  })
}

export function useRevokeApiKeyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (keyId: string) => revokeApiKey(keyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys-list'] })
    },
  })
}
