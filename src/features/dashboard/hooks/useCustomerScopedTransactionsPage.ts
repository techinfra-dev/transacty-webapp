import { useMemo, useState } from 'react'
import type { TransactionStatusTabId } from '../components/transactions/TransactionStatusTabs.tsx'
import { useTransactionStatusCounts } from './useTransactionStatusCounts.ts'
import { useTransactionsListQuery } from './useTransactionsQueries.ts'
import type { TransactionStatus } from '../services/transactionsSchemas.ts'

/** Global transactions table data, scoped to one customer wallet. */
export function useCustomerScopedTransactionsPage(
  customerId: string,
  enabled = true,
) {
  const [statusTab, setStatusTabState] = useState<TransactionStatusTabId>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const offset = (currentPage - 1) * pageSize
  const listStatus =
    statusTab === 'all' ? undefined : (statusTab as TransactionStatus)

  const statusCountsQuery = useTransactionStatusCounts({
    customerId,
  })

  const transactionsQuery = useTransactionsListQuery(
    {
      customerId,
      status: listStatus,
      limit: pageSize,
      offset,
    },
    { enabled },
  )

  const filteredTransactions = useMemo(
    () => transactionsQuery.data?.items ?? [],
    [transactionsQuery.data?.items],
  )

  const totalItems = transactionsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : offset + 1
  const pageRowCount = transactionsQuery.data?.items.length ?? 0
  const endItem =
    totalItems === 0 ? 0 : Math.min(offset + pageRowCount, totalItems)

  const statusTabs = useMemo(
    () => [
      { id: 'all' as const, label: 'All', count: statusCountsQuery.counts.all },
      {
        id: 'success' as const,
        label: 'Successful',
        count: statusCountsQuery.counts.success,
      },
      {
        id: 'pending' as const,
        label: 'Pending',
        count: statusCountsQuery.counts.pending,
      },
      {
        id: 'failed' as const,
        label: 'Failed',
        count: statusCountsQuery.counts.failed,
      },
    ],
    [statusCountsQuery.counts],
  )

  function setStatusTab(id: TransactionStatusTabId) {
    setStatusTabState(id)
    setCurrentPage(1)
  }

  return {
    transactionsQuery,
    statusTabs,
    statusTab,
    setStatusTab,
    filteredTransactions,
    startItem,
    endItem,
    totalItems,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    allCount: statusCountsQuery.counts.all,
  }
}
