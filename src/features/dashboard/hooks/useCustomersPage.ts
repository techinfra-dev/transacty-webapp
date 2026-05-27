import { useEffect, useMemo, useRef, useState } from 'react'
import type { CustomerItem, CustomerStatus } from '../services/customersSchemas.ts'
import { useCustomersListQuery } from './useCustomersQueries.ts'
import { useCustomerStatusCounts } from './useCustomerStatusCounts.ts'
import { useCustomersTotalBalance } from './useCustomersTotalBalance.ts'

export function useCustomersPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null)
  const [openActionsCustomerId, setOpenActionsCustomerId] = useState<string | null>(null)
  const actionsMenuRef = useRef<HTMLDivElement | null>(null)

  const normalizedSearch = searchQuery.trim()
  const isSearchActive = normalizedSearch.length > 0
  const listLimit = isSearchActive ? 200 : pageSize
  const listOffset = isSearchActive ? 0 : (currentPage - 1) * pageSize

  const customersQuery = useCustomersListQuery({
    limit: listLimit,
    offset: listOffset,
    status:
      statusFilter === 'all' ? undefined : (statusFilter as CustomerStatus),
  })

  const statusCounts = useCustomerStatusCounts(true)
  const totalBalanceQuery = useCustomersTotalBalance(
    statusCounts.total,
    !statusCounts.isLoading,
  )

  const filteredItems = useMemo(() => {
    const items = customersQuery.data?.items ?? []
    if (!isSearchActive) {
      return items
    }
    const needle = normalizedSearch.toLowerCase()
    return items.filter((customer) => {
      const label = customer.label?.toLowerCase() ?? ''
      return (
        customer.id.toLowerCase().includes(needle) || label.includes(needle)
      )
    })
  }, [customersQuery.data?.items, isSearchActive, normalizedSearch])

  const totalItems = isSearchActive
    ? filteredItems.length
    : (customersQuery.data?.total ?? 0)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const displayedItems = useMemo(() => {
    if (!isSearchActive) {
      return filteredItems
    }
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, isSearchActive, currentPage, pageSize])

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, pageSize, normalizedSearch])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!actionsMenuRef.current?.contains(event.target as Node)) {
        setOpenActionsCustomerId(null)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenActionsCustomerId(null)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscapeKey)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  async function copyCustomerId(customerId: string) {
    try {
      await navigator.clipboard.writeText(customerId)
      setCopiedCustomerId(customerId)
      window.setTimeout(() => setCopiedCustomerId(null), 1500)
    } catch {
      setCopiedCustomerId(null)
    }
  }

  function toggleActions(customerId: string) {
    setOpenActionsCustomerId((previousValue) =>
      previousValue === customerId ? null : customerId,
    )
  }

  return {
    statusFilter,
    setStatusFilter,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    customersQuery,
    statusCounts,
    totalBalanceQuery,
    displayedItems,
    totalItems,
    totalPages,
    startItem,
    endItem,
    copiedCustomerId,
    openActionsCustomerId,
    actionsMenuRef,
    copyCustomerId,
    toggleActions,
  }
}

export type CustomersPageCustomer = CustomerItem
