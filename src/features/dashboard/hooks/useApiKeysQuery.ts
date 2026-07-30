import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiKey, getApiKeys, revokeApiKey } from '../services/apiKeysService.ts'
import type { CreateApiKeyPayload } from '../services/apiKeysSchemas.ts'
import { prepareAdminStepUp } from '../utils/prepareSensitiveMutation.ts'

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
    mutationFn: async (payload: CreateApiKeyPayload) => {
      const { stepUpToken } = await prepareAdminStepUp('api_keys.write')
      return createApiKey(payload, { stepUpToken })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys-list'] })
    },
  })
}

export function useRevokeApiKeyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { stepUpToken } = await prepareAdminStepUp('api_keys.write')
      return revokeApiKey(keyId, { stepUpToken })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys-list'] })
    },
  })
}
