import { useQuery } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { getReconciliationReport } from '../services/reconciliationService.ts'

type UseReconciliationQueryParams = {
  from: string
  to: string
  enabled?: boolean
}

export function useReconciliationQuery({
  from,
  to,
  enabled = true,
}: UseReconciliationQueryParams) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['reconciliation-report', environment, from, to],
    queryFn: () =>
      getReconciliationReport({
        environment,
        from,
        to,
      }),
    enabled: enabled && Boolean(from && to),
    staleTime: 30_000,
  })
}
