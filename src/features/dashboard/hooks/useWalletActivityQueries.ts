import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { TRANSACTIONS_LIST_MAX_LIMIT } from '../components/transactions/transactionConstants.ts'
import { transactionMatchesCurrency } from '../components/transactions/transactionAmountUtils.ts'
import { listTransactions } from '../services/transactionsService.ts'
import type {
  TransactionItem,
  TransactionRailApi,
  TransactionStatus,
} from '../services/transactionsSchemas.ts'
import { useTransactionsListQuery } from './useTransactionsQueries.ts'
import type { TransactionStatusTabId } from '../components/transactions/TransactionStatusTabs.tsx'

const DUAL_POCKET_RAILS = new Set<TransactionRailApi>(['india', 'europe'])

export function isDualPocketRail(
  rail: TransactionRailApi | undefined,
): rail is TransactionRailApi {
  return Boolean(rail && DUAL_POCKET_RAILS.has(rail))
}

function filterWalletTransactions(
  items: TransactionItem[],
  walletCurrency: string,
) {
  return items.filter((item) => transactionMatchesCurrency(item, walletCurrency))
}

type UseWalletActivityQueriesParams = {
  walletRail: TransactionRailApi | undefined
  walletCurrency: string
  statusFilter: TransactionStatusTabId
  currentPage: number
  pageSize: number
  enabled: boolean
}

export function useWalletActivityQueries({
  walletRail,
  walletCurrency,
  statusFilter,
  currentPage,
  pageSize,
  enabled,
}: UseWalletActivityQueriesParams) {
  const listStatus = statusFilter === 'all' ? undefined : statusFilter
  const dualPocket = isDualPocketRail(walletRail)
  const offset = (currentPage - 1) * pageSize

  const bulkListQuery = useTransactionsListQuery(
    {
      rail: walletRail,
      status: listStatus,
      limit: TRANSACTIONS_LIST_MAX_LIMIT,
      offset: 0,
    },
    { enabled: enabled && dualPocket },
  )

  const pagedListQuery = useTransactionsListQuery(
    {
      rail: walletRail,
      currency: walletCurrency,
      status: listStatus,
      limit: pageSize,
      offset,
    },
    { enabled: enabled && !dualPocket },
  )

  const filteredBulkItems = useMemo(() => {
    if (!dualPocket) {
      return []
    }
    return filterWalletTransactions(
      bulkListQuery.data?.items ?? [],
      walletCurrency,
    )
  }, [bulkListQuery.data?.items, dualPocket, walletCurrency])

  const rows = useMemo(() => {
    if (dualPocket) {
      const start = offset
      return filteredBulkItems.slice(start, start + pageSize)
    }
    return filterWalletTransactions(
      pagedListQuery.data?.items ?? [],
      walletCurrency,
    )
  }, [
    dualPocket,
    filteredBulkItems,
    offset,
    pageSize,
    pagedListQuery.data?.items,
    walletCurrency,
  ])

  const activeListQuery = dualPocket ? bulkListQuery : pagedListQuery

  const totalItems = dualPocket
    ? filteredBulkItems.length
    : pagedListQuery.data?.total ?? rows.length

  return {
    rows,
    totalItems,
    transactionsQuery: activeListQuery,
    isDualPocket: dualPocket,
  }
}

export function useWalletActivityStatusCounts({
  walletRail,
  walletCurrency,
  enabled,
}: {
  walletRail: TransactionRailApi | undefined
  walletCurrency: string
  enabled: boolean
}) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  const dualPocket = isDualPocketRail(walletRail)

  const statuses: Array<TransactionStatus | undefined> = [
    undefined,
    'success',
    'pending',
    'failed',
  ]

  const results = useQueries({
    queries: statuses.map((status) => ({
      queryKey: [
        'wallet-activity-status-count',
        environment,
        walletRail ?? null,
        walletCurrency,
        dualPocket ? 'dual-pocket' : 'single-pocket',
        status ?? null,
      ],
      queryFn: () =>
        listTransactions({
          environment,
          rail: walletRail,
          currency: dualPocket ? undefined : walletCurrency,
          status,
          limit: dualPocket ? TRANSACTIONS_LIST_MAX_LIMIT : 1,
          offset: 0,
        }),
      staleTime: 30_000,
      enabled,
    })),
  })

  const counts = useMemo(() => {
    const [allQuery, successQuery, pendingQuery, failedQuery] = results

    if (!dualPocket) {
      return {
        all: allQuery.data?.total ?? 0,
        success: successQuery.data?.total ?? 0,
        pending: pendingQuery.data?.total ?? 0,
        failed: failedQuery.data?.total ?? 0,
      }
    }

    const countForStatus = (items: TransactionItem[] | undefined) =>
      filterWalletTransactions(items ?? [], walletCurrency).length

    return {
      all: countForStatus(allQuery.data?.items),
      success: countForStatus(successQuery.data?.items),
      pending: countForStatus(pendingQuery.data?.items),
      failed: countForStatus(failedQuery.data?.items),
    }
  }, [dualPocket, results, walletCurrency])

  return {
    counts,
    isPending: results.some((result) => result.isPending),
  }
}
