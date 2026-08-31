import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { TRANSACTIONS_LIST_MAX_LIMIT } from '../components/transactions/transactionConstants.ts'
import {
  transactionMatchesCurrency,
  walletCurrencyToListApiParam,
} from '../components/transactions/transactionAmountUtils.ts'
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

function sortByCreatedAtDesc(items: TransactionItem[]) {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.createdAt)
    const bTime = Date.parse(b.createdAt)
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return 0
    }
    return bTime - aTime
  })
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
  const listCurrency = walletCurrencyToListApiParam(walletCurrency)
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
      currency: listCurrency,
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
    return sortByCreatedAtDesc(
      filterWalletTransactions(bulkListQuery.data?.items ?? [], walletCurrency),
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

  const transactionsQuery = dualPocket ? bulkListQuery : pagedListQuery

  const totalItems = dualPocket
    ? filteredBulkItems.length
    : (pagedListQuery.data?.total ?? rows.length)

  return {
    rows,
    totalItems,
    transactionsQuery,
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
  const listCurrency = walletCurrencyToListApiParam(walletCurrency)

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
        listCurrency ?? walletCurrency,
        dualPocket ? 'merge-pocket' : 'single-pocket',
        status ?? null,
      ],
      queryFn: () =>
        listTransactions({
          environment,
          rail: walletRail,
          currency: dualPocket ? undefined : listCurrency,
          status,
          limit: dualPocket ? TRANSACTIONS_LIST_MAX_LIMIT : 1,
          offset: 0,
        }),
      staleTime: 30_000,
      enabled: enabled && Boolean(walletRail || !dualPocket),
    })),
  })

  const counts = useMemo(() => {
    if (!dualPocket) {
      const [allQuery, successQuery, pendingQuery, failedQuery] = results
      return {
        all: allQuery?.data?.total ?? 0,
        success: successQuery?.data?.total ?? 0,
        pending: pendingQuery?.data?.total ?? 0,
        failed: failedQuery?.data?.total ?? 0,
      }
    }

    return {
      all: filterWalletTransactions(results[0]?.data?.items ?? [], walletCurrency)
        .length,
      success: filterWalletTransactions(
        results[1]?.data?.items ?? [],
        walletCurrency,
      ).length,
      pending: filterWalletTransactions(
        results[2]?.data?.items ?? [],
        walletCurrency,
      ).length,
      failed: filterWalletTransactions(
        results[3]?.data?.items ?? [],
        walletCurrency,
      ).length,
    }
  }, [dualPocket, results, walletCurrency])

  return {
    counts,
    isPending: results.some((result) => result.isPending),
  }
}
