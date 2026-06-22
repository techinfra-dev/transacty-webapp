import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  getApiIpRules,
  updateApiIpRules,
} from '../services/apiIpRulesService.ts'
import type { UpdateApiIpRulesPayload } from '../services/apiIpRulesSchemas.ts'

export function useApiIpRulesQuery(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['api-ip-rules', environment],
    queryFn: () => getApiIpRules({ environment }),
    enabled,
    staleTime: 30_000,
  })
}

export function useUpdateApiIpRulesMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useMutation({
    mutationFn: (payload: Omit<UpdateApiIpRulesPayload, 'environment'>) =>
      updateApiIpRules({
        environment,
        ...payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-ip-rules', environment] })
    },
  })
}
