import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  useCreateRefundMutation,
  useCreateTransferMutation,
  useTransactionDetailQuery,
  useTransactionsListQuery,
} from './useTransactionsQueries.ts'
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
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [transferCustomerWalletId, setTransferCustomerWalletId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [refundCustomerWalletId, setRefundCustomerWalletId] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundOfTransactionId, setRefundOfTransactionId] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
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
  const createTransferMutation = useCreateTransferMutation()
  const createRefundMutation = useCreateRefundMutation()
  const transactionDetailQuery = useTransactionDetailQuery(selectedTransactionId)

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

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await createTransferMutation.mutateAsync({
        customerWalletId: transferCustomerWalletId.trim(),
        amount: transferAmount.trim(),
        reason: transferReason.trim().length > 0 ? transferReason.trim() : undefined,
      })
      setTransferCustomerWalletId('')
      setTransferAmount('')
      setTransferReason('')
      setIsTransferDialogOpen(false)
    } catch {
      // Error is rendered by mutation state.
    }
  }

  async function handleRefundSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await createRefundMutation.mutateAsync({
        customerWalletId: refundCustomerWalletId.trim(),
        amount: refundAmount.trim(),
        refundOfTransactionId: refundOfTransactionId.trim(),
        reason: refundReason.trim().length > 0 ? refundReason.trim() : undefined,
      })
      setRefundCustomerWalletId('')
      setRefundAmount('')
      setRefundOfTransactionId('')
      setRefundReason('')
      setIsRefundDialogOpen(false)
    } catch {
      // Error is rendered by mutation state.
    }
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
    isTransferDialogOpen,
    setIsTransferDialogOpen,
    isRefundDialogOpen,
    setIsRefundDialogOpen,
    transferCustomerWalletId,
    setTransferCustomerWalletId,
    transferAmount,
    setTransferAmount,
    transferReason,
    setTransferReason,
    refundCustomerWalletId,
    setRefundCustomerWalletId,
    refundAmount,
    setRefundAmount,
    refundOfTransactionId,
    setRefundOfTransactionId,
    refundReason,
    setRefundReason,
    selectedTransactionId,
    setSelectedTransactionId,
    filterMenuRef,
    transactionsQuery,
    createTransferMutation,
    createRefundMutation,
    transactionDetailQuery,
    filteredTransactions,
    totalItems,
    totalPages,
    startItem,
    endItem,
    handleTransferSubmit,
    handleRefundSubmit,
  }
}
