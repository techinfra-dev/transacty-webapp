import { useQueries } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { listCustomers } from '../services/customersService.ts'
import type { CustomerStatus } from '../services/customersSchemas.ts'

const countStatuses: CustomerStatus[] = ['active', 'frozen', 'pending', 'closed']

export function useCustomerStatusCounts(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  const queries = useQueries({
    queries: [
      {
        queryKey: ['customers-count', environment, 'all'],
        queryFn: () =>
          listCustomers({ environment, limit: 1, offset: 0 }),
        enabled,
        staleTime: 30_000,
      },
      ...countStatuses.map((status) => ({
        queryKey: ['customers-count', environment, status],
        queryFn: () =>
          listCustomers({ environment, limit: 1, offset: 0, status }),
        enabled,
        staleTime: 30_000,
      })),
    ],
  })

  const [totalQuery, activeQuery, frozenQuery, pendingQuery, closedQuery] = queries

  return {
    isLoading: queries.some((query) => query.isPending),
    total: totalQuery.data?.total ?? 0,
    active: activeQuery.data?.total ?? 0,
    frozen: frozenQuery.data?.total ?? 0,
    pending: pendingQuery.data?.total ?? 0,
    closed: closedQuery.data?.total ?? 0,
  }
}
