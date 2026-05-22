import { useEffect, useMemo, useRef, useState } from 'react'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
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
  const filterMenuRef = useRef<HTMLDivElement | null>(null)

  const normalizedCustomerId = customerIdFilter.trim()
  const normalizedQuery = query.trim().toLowerCase()
  const offset = (currentPage - 1) * pageSize

  const transactionsQuery = useTransactionsListQuery({
    type:
      selectedMethod === 'all'
        ? undefined
        : (selectedMethod as TransactionType),
    status:
      selectedStatus === 'all'
        ? undefined
        : (selectedStatus as TransactionStatus),
    customerId: normalizedCustomerId.length > 0 ? normalizedCustomerId : undefined,
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

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!filterMenuRef.current) {
        return
      }
      if (!filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterPanelOpen(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFilterPanelOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscapeKey)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  return {
    query,
    setQuery,
    selectedMethod,
    setSelectedMethod,
    selectedStatus,
    setSelectedStatus,
    customerIdFilter,
    setCustomerIdFilter,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
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
    filterMenuRef,
    transactionsQuery,
    filteredTransactions,
    totalItems,
    totalPages,
    startItem,
    endItem,
  }
}
