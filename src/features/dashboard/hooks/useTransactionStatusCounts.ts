import { useQueries } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { listTransactions } from '../services/transactionsService.ts'
import type {
  TransactionStatus,
  TransactionType,
} from '../services/transactionsSchemas.ts'

type UseTransactionStatusCountsParams = {
  type?: TransactionType
  customerId?: string
}

export function useTransactionStatusCounts({
  type,
  customerId,
}: UseTransactionStatusCountsParams) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  const statuses: Array<TransactionStatus | undefined> = [
    undefined,
    'success',
    'pending',
    'failed',
  ]

  const results = useQueries({
    queries: statuses.map((status) => ({
      queryKey: [
        'transactions-list-count',
        environment,
        { type, customerId, status },
      ],
      queryFn: () =>
        listTransactions({
          environment,
          type,
          customerId,
          status,
          limit: 1,
          offset: 0,
        }),
      staleTime: 30_000,
    })),
  })

  const [allQuery, successQuery, pendingQuery, failedQuery] = results

  return {
    isPending: results.some((result) => result.isPending),
    counts: {
      all: allQuery.data?.total ?? 0,
      success: successQuery.data?.total ?? 0,
      pending: pendingQuery.data?.total ?? 0,
      failed: failedQuery.data?.total ?? 0,
    },
  }
}
