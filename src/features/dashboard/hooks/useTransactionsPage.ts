import { useMemo, useState } from 'react'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
import type { TransactionStatusTabId } from '../components/transactions/TransactionStatusTabs.tsx'
import { useTransactionStatusCounts } from './useTransactionStatusCounts.ts'
import { useTransactionsListQuery } from './useTransactionsQueries.ts'
import type {
  TransactionStatus,
  TransactionType,
} from '../services/transactionsSchemas.ts'

export function useTransactionsPage() {
  const [query, setQuery] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [customerIdFilter, setCustomerIdFilter] = useState('')
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )
  const closeTransactionDetail = useTransactionDetailModalStore(
    (state) => state.closeTransactionDetail,
  )

  function setSelectedTransactionId(id: string | null) {
    if (id === null) {
      closeTransactionDetail()
    } else {
      openTransactionDetail(id)
    }
  }
  const normalizedCustomerId = customerIdFilter.trim()
  const normalizedQuery = query.trim().toLowerCase()
  const offset = (currentPage - 1) * pageSize
  const listType =
    selectedMethod === 'all' ? undefined : (selectedMethod as TransactionType)
  const listStatus =
    selectedStatus === 'all' ? undefined : (selectedStatus as TransactionStatus)
  const listCustomerId =
    normalizedCustomerId.length > 0 ? normalizedCustomerId : undefined

  const statusCountsQuery = useTransactionStatusCounts({
    type: listType,
    customerId: listCustomerId,
  })

  const transactionsQuery = useTransactionsListQuery({
    type: listType,
    status: listStatus,
    customerId: listCustomerId,
    limit: pageSize,
    offset,
  })
  const filteredTransactions = useMemo(
    () =>
      (transactionsQuery.data?.items ?? []).filter((transaction) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          transaction.id.toLowerCase().includes(normalizedQuery) ||
          (transaction.platformOrderId || '').toLowerCase().includes(normalizedQuery)

        const transactionTime = new Date(transaction.createdAt).getTime()
        const startTime = appliedStartDate
          ? new Date(`${appliedStartDate}T00:00:00`).getTime()
          : Number.NEGATIVE_INFINITY
        const endTime = appliedEndDate
          ? new Date(`${appliedEndDate}T23:59:59`).getTime()
          : Number.POSITIVE_INFINITY
        const matchesDateRange = transactionTime >= startTime && transactionTime <= endTime

        return matchesQuery && matchesDateRange
      }),
    [
      transactionsQuery.data?.items,
      normalizedQuery,
      appliedStartDate,
      appliedEndDate,
    ],
  )

  const totalItems = transactionsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : offset + 1
  const endItem = Math.min(offset + pageSize, totalItems)

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
    setSelectedStatus(id)
    setCurrentPage(1)
  }

  function openFilterDialog() {
    setTempStartDate(appliedStartDate)
    setTempEndDate(appliedEndDate)
    setIsFilterDialogOpen(true)
  }

  function closeFilterDialog() {
    setTempStartDate(appliedStartDate)
    setTempEndDate(appliedEndDate)
    setIsFilterDialogOpen(false)
  }

  return {
    query,
    setQuery,
    selectedMethod,
    setSelectedMethod,
    selectedStatus,
    setSelectedStatus,
    customerIdFilter,
    setCustomerIdFilter,
    isFilterDialogOpen,
    openFilterDialog,
    closeFilterDialog,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    appliedStartDate,
    setAppliedStartDate,
    appliedEndDate,
    setAppliedEndDate,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    setSelectedTransactionId,
    transactionsQuery,
    filteredTransactions,
    totalItems,
    totalPages,
    startItem,
    endItem,
    statusTabs,
    statusTab: selectedStatus as TransactionStatusTabId,
    setStatusTab,
  }
}
