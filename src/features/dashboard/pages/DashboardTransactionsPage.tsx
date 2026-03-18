import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { DropdownSelect } from '../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../components/ui/Input.tsx'

type TransactionStatus = 'Successful' | 'Pending' | 'Failed'
type PaymentMethod = 'bKash' | 'Nagad' | 'Upay' | 'Bank Transfer'

interface TransactionRow {
  id: string
  method: PaymentMethod
  customer: string
  amount: string
  fee: string
  net: string
  status: TransactionStatus
  date: string
}

const allTransactions: TransactionRow[] = [
  {
    id: 'TRX-9107867',
    method: 'bKash',
    customer: 'Green Ventures Ltd.',
    amount: 'BDT 50,093.00',
    fee: 'BDT 150.28',
    net: 'BDT 49,942.72',
    status: 'Successful',
    date: 'Mar 13, 2026 02:07 PM',
  },
  {
    id: 'TRX-9107854',
    method: 'Bank Transfer',
    customer: 'Redbiller Ops',
    amount: 'BDT 45,093.00',
    fee: 'BDT 135.27',
    net: 'BDT 44,957.73',
    status: 'Successful',
    date: 'Mar 13, 2026 12:12 PM',
  },
  {
    id: 'TRX-9107849',
    method: 'Nagad',
    customer: 'LipeTech BD',
    amount: 'BDT 21,093.00',
    fee: 'BDT 63.28',
    net: 'BDT 21,029.72',
    status: 'Successful',
    date: 'Mar 12, 2026 07:41 PM',
  },
  {
    id: 'TRX-9107840',
    method: 'Upay',
    customer: 'Rydel Logistics',
    amount: 'BDT 8,043.00',
    fee: 'BDT 24.13',
    net: 'BDT 8,018.87',
    status: 'Successful',
    date: 'Mar 12, 2026 05:12 PM',
  },
  {
    id: 'TRX-9107836',
    method: 'bKash',
    customer: 'TwP Ventures',
    amount: 'BDT 8,243.00',
    fee: 'BDT 24.73',
    net: 'BDT 8,218.27',
    status: 'Pending',
    date: 'Mar 12, 2026 12:01 PM',
  },
  {
    id: 'TRX-9107828',
    method: 'Bank Transfer',
    customer: 'Redbiller Internal',
    amount: 'BDT 151,925.00',
    fee: 'BDT 455.77',
    net: 'BDT 151,469.23',
    status: 'Successful',
    date: 'Mar 11, 2026 10:53 AM',
  },
  {
    id: 'TRX-9107821',
    method: 'Nagad',
    customer: 'Swanline Retail',
    amount: 'BDT 6,043.00',
    fee: 'BDT 18.13',
    net: 'BDT 6,024.87',
    status: 'Failed',
    date: 'Mar 11, 2026 09:23 AM',
  },
  {
    id: 'TRX-9107813',
    method: 'bKash',
    customer: 'CrownPeak',
    amount: 'BDT 4,040.00',
    fee: 'BDT 12.12',
    net: 'BDT 4,027.88',
    status: 'Successful',
    date: 'Mar 10, 2026 12:46 PM',
  },
  {
    id: 'TRX-9107807',
    method: 'Upay',
    customer: 'BlueRay Foods',
    amount: 'BDT 9,040.00',
    fee: 'BDT 27.12',
    net: 'BDT 9,012.88',
    status: 'Successful',
    date: 'Mar 10, 2026 08:17 AM',
  },
]

const methodOptions = [
  { value: 'all', label: 'All methods' },
  { value: 'bKash', label: 'bKash' },
  { value: 'Nagad', label: 'Nagad' },
  { value: 'Upay', label: 'Upay' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
]

const statusOptions = [
  { value: 'all', label: 'All status' },
  { value: 'Successful', label: 'Successful' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
]

const pageSizeOptions = [
  { value: '10', label: '10 / page' },
  { value: '100', label: '100 / page' },
]

function getStatusClassName(status: TransactionStatus) {
  if (status === 'Successful') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'Pending') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-rose-100 text-rose-700'
}

export function DashboardTransactionsPage() {
  const [query, setQuery] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const filterMenuRef = useRef<HTMLDivElement | null>(null)

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      const matchesMethod =
        selectedMethod === 'all' || transaction.method === selectedMethod
      const matchesStatus =
        selectedStatus === 'all' || transaction.status === selectedStatus
      const normalizedQuery = query.trim().toLowerCase()
      const matchesQuery =
        normalizedQuery.length === 0 ||
        transaction.id.toLowerCase().includes(normalizedQuery) ||
        transaction.customer.toLowerCase().includes(normalizedQuery)

      const transactionDate = new Date(transaction.date)
      const transactionTime = transactionDate.getTime()
      const startTime = appliedStartDate
        ? new Date(`${appliedStartDate}T00:00:00`).getTime()
        : Number.NEGATIVE_INFINITY
      const endTime = appliedEndDate
        ? new Date(`${appliedEndDate}T23:59:59`).getTime()
        : Number.POSITIVE_INFINITY
      const matchesDateRange = transactionTime >= startTime && transactionTime <= endTime

      return matchesMethod && matchesStatus && matchesQuery && matchesDateRange
    })
  }, [
    query,
    selectedMethod,
    selectedStatus,
    appliedStartDate,
    appliedEndDate,
  ])

  const totalItems = filteredTransactions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  const paginatedTransactions = useMemo(() => {
    const from = (currentPage - 1) * pageSize
    const to = from + pageSize
    return filteredTransactions.slice(from, to)
  }, [currentPage, pageSize, filteredTransactions])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    query,
    selectedMethod,
    selectedStatus,
    pageSize,
    appliedStartDate,
    appliedEndDate,
  ])

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

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <header className="relative z-20 rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
              Transactions History
            </h1>
            <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Track payins and payouts with method, fee, net amount, and status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div ref={filterMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen((previousValue) => !previousValue)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-accent)/45 bg-(--color-card) text-(--color-foreground) transition hover:border-(--color-secondary)/55 focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20"
                aria-label="Toggle transaction filters"
                aria-expanded={isFilterPanelOpen}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                  <path d="M3.25 4.75a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 .58 1.22L12 10.92V15a.75.75 0 0 1-.44.68l-2.5 1.12A.75.75 0 0 1 8 16.12v-5.2L3.42 5.22a.75.75 0 0 1-.17-.47Z" />
                </svg>
              </button>

              {isFilterPanelOpen ? (
                <div className="absolute right-0 top-full z-30 mt-2 w-[min(92vw,420px)] rounded-xl border border-(--color-accent)/35 bg-(--color-card) p-4">
                  <h2 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
                    Transaction Filter
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
                        Start Date
                      </span>
                      <Input
                        type="date"
                        value={tempStartDate}
                        onChange={(event) => setTempStartDate(event.target.value)}
                        className="h-10 cursor-pointer bg-(--color-card)"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
                        End Date
                      </span>
                      <Input
                        type="date"
                        value={tempEndDate}
                        onChange={(event) => setTempEndDate(event.target.value)}
                        className="h-10 cursor-pointer bg-(--color-card)"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="h-9 border border-(--color-accent)/45 px-3 text-xs"
                      onClick={() => {
                        setTempStartDate('')
                        setTempEndDate('')
                        setAppliedStartDate('')
                        setAppliedEndDate('')
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      className="h-9 px-3 text-xs"
                      onClick={() => {
                        setAppliedStartDate(tempStartDate)
                        setAppliedEndDate(tempEndDate)
                        setIsFilterPanelOpen(false)
                      }}
                    >
                      Apply Filter
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="inline-flex rounded-full border border-(--color-accent)/45 bg-(--color-background) px-3 py-1.5 [font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              {filteredTransactions.length} records
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder="Search by transaction ID or customer"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 bg-(--color-card)"
          />
          <DropdownSelect
            ariaLabel="Filter transactions by method"
            options={methodOptions}
            value={selectedMethod}
            onChange={setSelectedMethod}
          />
          <DropdownSelect
            ariaLabel="Filter transactions by status"
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        </div>

      </header>

      <section className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--color-accent)/45 bg-(--color-card)">
        <div className="hidden grid-cols-[132px_1.8fr_124px_108px_124px_108px_138px] gap-3 border-b border-(--color-accent)/35 px-5 py-3 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-wide text-(--color-secondary) lg:grid">
          <p>Transaction</p>
          <p>Customer</p>
          <p>Method</p>
          <p>Amount</p>
          <p>Fee</p>
          <p>Status</p>
          <p>Date</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              No transactions found for the selected filters.
            </div>
          ) : (
            paginatedTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="grid gap-2 border-b border-(--color-accent)/25 px-5 py-3 last:border-b-0 lg:grid-cols-[132px_1.8fr_124px_108px_124px_108px_138px] lg:items-center lg:gap-3"
              >
                <div>
                  <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
                    {transaction.id}
                  </p>
                  <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary) lg:hidden">
                    {transaction.date}
                  </p>
                </div>

                <div>
                  <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                    {transaction.customer}
                  </p>
                  <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary) lg:hidden">
                    Net: {transaction.net}
                  </p>
                </div>

                <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                  {transaction.method}
                </p>
                <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                  {transaction.amount}
                </p>
                <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  {transaction.fee}
                </p>

                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-xs font-semibold ${getStatusClassName(
                      transaction.status,
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </div>

                <p className="hidden [font-family:var(--font-body)] text-xs text-(--color-secondary) lg:block">
                  {transaction.date}
                </p>
              </article>
            ))
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-(--color-accent)/35 px-5 py-3 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
          <p>
            Showing {startItem}-{endItem} of {totalItems}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownSelect
              ariaLabel="Select transactions per page"
              options={pageSizeOptions}
              value={String(pageSize)}
              onChange={(value) => setPageSize(Number(value))}
              className="min-w-[112px]"
              menuPlacement="top"
            />
            <Button
              variant="ghost"
              className="h-9 border border-(--color-accent)/45 px-3 text-xs"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((previousPage) => previousPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              className="h-9 border border-(--color-accent)/45 px-3 text-xs"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((previousPage) => previousPage + 1)}
            >
              Next
            </Button>
            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </footer>
      </section>
    </section>
  )
}
