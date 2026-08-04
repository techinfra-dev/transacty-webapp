import { useMemo } from 'react'
import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { TRANSACTIONS_LIST_MAX_LIMIT } from '../components/transactions/transactionConstants.ts'
import { transactionMatchesCurrency } from '../components/transactions/transactionAmountUtils.ts'
import { listTransactions } from '../services/transactionsService.ts'
import type {
  TransactionItem,
  TransactionRailApi,
  TransactionStatus,
  TransactionsListResponse,
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
  const includePyusdCompanion =
    walletCurrency.trim().toUpperCase() === 'USDC'
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

  const pyusdCompanionQuery = useTransactionsListQuery(
    {
      rail: 'pyusd',
      status: listStatus,
      limit: TRANSACTIONS_LIST_MAX_LIMIT,
      offset: 0,
    },
    { enabled: enabled && includePyusdCompanion },
  )

  const pagedListQuery = useTransactionsListQuery(
    {
      rail: walletRail,
      currency: walletCurrency,
      status: listStatus,
      limit: pageSize,
      offset,
    },
    { enabled: enabled && !dualPocket && !includePyusdCompanion },
  )

  const filteredBulkItems = useMemo(() => {
    const primary = dualPocket
      ? filterWalletTransactions(
          bulkListQuery.data?.items ?? [],
          walletCurrency,
        )
      : []
    const companion = includePyusdCompanion
      ? filterWalletTransactions(
          pyusdCompanionQuery.data?.items ?? [],
          walletCurrency,
        )
      : []

    if (!dualPocket && !includePyusdCompanion) {
      return []
    }

    const byId = new Map<string, TransactionItem>()
    for (const item of [...primary, ...companion]) {
      byId.set(item.id, item)
    }
    return sortByCreatedAtDesc([...byId.values()])
  }, [
    bulkListQuery.data?.items,
    dualPocket,
    includePyusdCompanion,
    pyusdCompanionQuery.data?.items,
    walletCurrency,
  ])

  const rows = useMemo(() => {
    if (dualPocket || includePyusdCompanion) {
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
    includePyusdCompanion,
    offset,
    pageSize,
    pagedListQuery.data?.items,
    walletCurrency,
  ])

  const transactionsQuery = (() => {
    if (dualPocket && includePyusdCompanion) {
      return {
        ...bulkListQuery,
        isPending: bulkListQuery.isPending || pyusdCompanionQuery.isPending,
        isFetching: bulkListQuery.isFetching || pyusdCompanionQuery.isFetching,
        isError: bulkListQuery.isError || pyusdCompanionQuery.isError,
        error: bulkListQuery.error ?? pyusdCompanionQuery.error,
      } as UseQueryResult<TransactionsListResponse, Error>
    }
    if (dualPocket) {
      return bulkListQuery
    }
    if (includePyusdCompanion) {
      return pyusdCompanionQuery
    }
    return pagedListQuery
  })()

  const totalItems =
    dualPocket || includePyusdCompanion
      ? filteredBulkItems.length
      : pagedListQuery.data?.total ?? rows.length

  return {
    rows,
    totalItems,
    transactionsQuery,
    isDualPocket: dualPocket || includePyusdCompanion,
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
  const includePyusdCompanion =
    walletCurrency.trim().toUpperCase() === 'USDC'
  const mergeMode = dualPocket || includePyusdCompanion

  const statuses: Array<TransactionStatus | undefined> = [
    undefined,
    'success',
    'pending',
    'failed',
  ]

  const results = useQueries({
    queries: statuses.flatMap((status) => {
      const primary = {
        queryKey: [
          'wallet-activity-status-count',
          environment,
          walletRail ?? null,
          walletCurrency,
          mergeMode ? 'merge-pocket' : 'single-pocket',
          status ?? null,
        ],
        queryFn: () =>
          listTransactions({
            environment,
            rail: walletRail,
            currency: mergeMode ? undefined : walletCurrency,
            status,
            limit: mergeMode ? TRANSACTIONS_LIST_MAX_LIMIT : 1,
            offset: 0,
          }),
        staleTime: 30_000,
        enabled:
          enabled &&
          (includePyusdCompanion
            ? Boolean(walletRail)
            : Boolean(walletRail || !mergeMode)),
      }
      if (!includePyusdCompanion) {
        return [primary]
      }
      return [
        primary,
        {
          queryKey: [
            'wallet-activity-status-count',
            environment,
            'pyusd',
            walletCurrency,
            'companion',
            status ?? null,
          ],
          queryFn: () =>
            listTransactions({
              environment,
              rail: 'pyusd',
              status,
              limit: TRANSACTIONS_LIST_MAX_LIMIT,
              offset: 0,
            }),
          staleTime: 30_000,
          enabled,
        },
      ]
    }),
  })

  const counts = useMemo(() => {
    if (!mergeMode) {
      const [allQuery, successQuery, pendingQuery, failedQuery] = results
      return {
        all: allQuery?.data?.total ?? 0,
        success: successQuery?.data?.total ?? 0,
        pending: pendingQuery?.data?.total ?? 0,
        failed: failedQuery?.data?.total ?? 0,
      }
    }

    const countForPair = (primaryItems?: TransactionItem[], companionItems?: TransactionItem[]) => {
      const byId = new Map<string, TransactionItem>()
      for (const item of [
        ...filterWalletTransactions(primaryItems ?? [], walletCurrency),
        ...filterWalletTransactions(companionItems ?? [], walletCurrency),
      ]) {
        byId.set(item.id, item)
      }
      return byId.size
    }

    // results layout: [allPrimary, allCompanion?, successPrimary, successCompanion?, ...]
    if (includePyusdCompanion && dualPocket) {
      return {
        all: countForPair(results[0]?.data?.items, results[1]?.data?.items),
        success: countForPair(results[2]?.data?.items, results[3]?.data?.items),
        pending: countForPair(results[4]?.data?.items, results[5]?.data?.items),
        failed: countForPair(results[6]?.data?.items, results[7]?.data?.items),
      }
    }

    if (includePyusdCompanion && !dualPocket) {
      // primary may be europe/undefined — still pair with companion
      return {
        all: countForPair(results[0]?.data?.items, results[1]?.data?.items),
        success: countForPair(results[2]?.data?.items, results[3]?.data?.items),
        pending: countForPair(results[4]?.data?.items, results[5]?.data?.items),
        failed: countForPair(results[6]?.data?.items, results[7]?.data?.items),
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
  }, [dualPocket, includePyusdCompanion, mergeMode, results, walletCurrency])

  return {
    counts,
    isPending: results.some((result) => result.isPending),
  }
}
