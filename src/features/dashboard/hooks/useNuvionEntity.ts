import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  createNuvionEntity,
  getNuvionEntity,
} from '../services/nuvionEntityService.ts'
import type { CreateNuvionEntityPayload } from '../services/nuvionEntitySchemas.ts'
import {
  isNuvionEntityPending,
} from '../utils/nuvionMarket.ts'

export function nuvionEntityQueryKey(environment: string) {
  return ['nuvion-entity', environment] as const
}

export function useNuvionEntityQuery(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: nuvionEntityQueryKey(environment),
    queryFn: () => getNuvionEntity(environment),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (isNuvionEntityPending(status)) {
        return 15_000
      }
      return false
    },
  })
}

export function useCreateNuvionEntityMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useMutation({
    mutationFn: (payload: Omit<CreateNuvionEntityPayload, 'environment'>) =>
      createNuvionEntity({ ...payload, environment }),
    onSuccess: async (entity) => {
      queryClient.setQueryData(nuvionEntityQueryKey(environment), entity)
      await queryClient.invalidateQueries({
        queryKey: nuvionEntityQueryKey(environment),
      })
    },
  })
}
