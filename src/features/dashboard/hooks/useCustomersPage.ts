import { useEffect, useMemo, useState } from 'react'
import type { CustomerItem, CustomerStatus } from '../services/customersSchemas.ts'
import { useCustomersListQuery } from './useCustomersQueries.ts'
import { useCustomerStatusCounts } from './useCustomerStatusCounts.ts'
import { useCustomersTotalBalance } from './useCustomersTotalBalance.ts'

export function useCustomersPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null)

  const normalizedSearch = searchQuery.trim()
  const isSearchActive = normalizedSearch.length > 0
  const isCurrencyFiltered = currencyFilter !== 'all'
  const needsClientFilter = isSearchActive || isCurrencyFiltered
  const listLimit = needsClientFilter ? 200 : pageSize
  const listOffset = needsClientFilter ? 0 : (currentPage - 1) * pageSize

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

  const currencyOptions = useMemo(() => {
    const codes = (totalBalanceQuery.data?.byCurrency ?? []).map(
      (entry) => entry.currency,
    )
    return [
      { value: 'all', label: 'All currencies' },
      ...codes.map((code) => ({ value: code, label: code })),
    ]
  }, [totalBalanceQuery.data?.byCurrency])

  const filteredItems = useMemo(() => {
    let items = customersQuery.data?.items ?? []
    if (isCurrencyFiltered) {
      const needle = currencyFilter.trim().toUpperCase()
      items = items.filter(
        (customer) => customer.currency.trim().toUpperCase() === needle,
      )
    }
    if (isSearchActive) {
      const needle = normalizedSearch.toLowerCase()
      items = items.filter((customer) => {
        const label = customer.label?.toLowerCase() ?? ''
        return (
          customer.id.toLowerCase().includes(needle) || label.includes(needle)
        )
      })
    }
    return items
  }, [
    currencyFilter,
    customersQuery.data?.items,
    isCurrencyFiltered,
    isSearchActive,
    normalizedSearch,
  ])

  const totalItems = needsClientFilter
    ? filteredItems.length
    : (customersQuery.data?.total ?? 0)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const displayedItems = useMemo(() => {
    if (!needsClientFilter) {
      return filteredItems
    }
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, needsClientFilter, currentPage, pageSize])

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const hasActiveFilters =
    statusFilter !== 'all' || currencyFilter !== 'all' || isSearchActive

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, currencyFilter, pageSize, normalizedSearch])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  async function copyCustomerId(customerId: string) {
    try {
      await navigator.clipboard.writeText(customerId)
      setCopiedCustomerId(customerId)
      window.setTimeout(() => setCopiedCustomerId(null), 1500)
    } catch {
      setCopiedCustomerId(null)
    }
  }

  function clearFilters() {
    setStatusFilter('all')
    setCurrencyFilter('all')
    setSearchQuery('')
  }

  return {
    statusFilter,
    setStatusFilter,
    currencyFilter,
    setCurrencyFilter,
    currencyOptions,
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
    copyCustomerId,
    hasActiveFilters,
    clearFilters,
    normalizedSearch,
  }
}

export type CustomersPageCustomer = CustomerItem
