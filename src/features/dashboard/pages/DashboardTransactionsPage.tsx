import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import {
  useCreateRefundMutation,
  useCreateTransferMutation,
  useTransactionDetailQuery,
  useTransactionsListQuery,
} from '../hooks/useTransactionsQueries.ts'
import type {
  TransactionItem,
  TransactionStatus,
  TransactionType,
} from '../services/transactionsSchemas.ts'

const methodOptions = [
  { value: 'all', label: 'All types' },
  { value: 'payin', label: 'Payin' },
  { value: 'payout', label: 'Payout' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'refund', label: 'Refund' },
]

const statusOptions = [
  { value: 'all', label: 'All status' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

const pageSizeOptions = [
  { value: '10', label: '10 / page' },
  { value: '100', label: '100 / page' },
]

function getStatusClassName(status: TransactionStatus) {
  if (status === 'success') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-rose-100 text-rose-700'
}

function toTitleCase(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatMoney(amountText: string) {
  const amountNumber = Number(amountText)
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0
  return `BDT ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function DashboardTransactionsPage() {
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
            <Button
              variant="ghost"
              className="h-9 border border-(--color-accent)/45 px-3 text-xs"
              onClick={() => setIsTransferDialogOpen(true)}
            >
              Create transfer
            </Button>
            <Button
              variant="ghost"
              className="h-9 border border-(--color-accent)/45 px-3 text-xs"
              onClick={() => setIsRefundDialogOpen(true)}
            >
              Create refund
            </Button>
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
                        setCurrentPage(1)
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      className="h-9 px-3 text-xs"
                      onClick={() => {
                        setAppliedStartDate(tempStartDate)
                        setAppliedEndDate(tempEndDate)
                        setCurrentPage(1)
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
              {totalItems} records
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <Input
            placeholder="Search by transaction ID or platform order ID"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setCurrentPage(1)
            }}
            className="h-10 bg-(--color-card)"
          />
          <Input
            placeholder="Customer wallet ID"
            value={customerIdFilter}
            onChange={(event) => {
              setCustomerIdFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-10 bg-(--color-card)"
          />
          <DropdownSelect
            ariaLabel="Filter transactions by type"
            options={methodOptions}
            value={selectedMethod}
            onChange={(value) => {
              setSelectedMethod(value)
              setCurrentPage(1)
            }}
          />
          <DropdownSelect
            ariaLabel="Filter transactions by status"
            options={statusOptions}
            value={selectedStatus}
            onChange={(value) => {
              setSelectedStatus(value)
              setCurrentPage(1)
            }}
          />
        </div>

      </header>

      <section className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--color-accent)/45 bg-(--color-card)">
        <div className="hidden grid-cols-[132px_1.2fr_124px_108px_124px_138px_120px_92px] gap-3 border-b border-(--color-accent)/35 px-5 py-3 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-wide text-(--color-secondary) lg:grid">
          <p>Transaction</p>
          <p>Reference</p>
          <p>Type</p>
          <p>Amount</p>
          <p>Paid amount</p>
          <p>Status</p>
          <p>Date</p>
          <p>Action</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {transactionsQuery.isPending ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <LoadingSpinner label="Loading transactions..." />
            </div>
          ) : transactionsQuery.isError ? (
            <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-rose-600">
              {transactionsQuery.error.message}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              No transactions found for the selected filters.
            </div>
          ) : (
            filteredTransactions.map((transaction: TransactionItem) => (
              <article
                key={transaction.id}
                className="grid gap-2 border-b border-(--color-accent)/25 px-5 py-3 last:border-b-0 lg:grid-cols-[132px_1.2fr_124px_108px_124px_138px_120px_92px] lg:items-center lg:gap-3"
              >
                <div>
                  <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
                    {transaction.id}
                  </p>
                  <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary) lg:hidden">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                    {transaction.platformOrderId || transaction.customerWalletId || '-'}
                  </p>
                  <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary) lg:hidden">
                    Paid: {formatMoney(transaction.paidAmount || transaction.amount)}
                  </p>
                </div>

                <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                  {toTitleCase(transaction.type)}
                </p>
                <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                  {formatMoney(transaction.amount)}
                </p>
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  {formatMoney(transaction.paidAmount || transaction.amount)}
                </p>

                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-xs font-semibold ${getStatusClassName(
                      transaction.status,
                    )}`}
                  >
                    {toTitleCase(transaction.status)}
                  </span>
                </div>

                <p className="hidden [font-family:var(--font-body)] text-xs text-(--color-secondary) lg:block">
                  {formatDate(transaction.createdAt)}
                </p>

                <div>
                  <Button
                    variant="ghost"
                    className="h-8 border border-(--color-accent)/45 px-2 text-xs"
                    onClick={() => setSelectedTransactionId(transaction.id)}
                  >
                    View
                  </Button>
                </div>
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
              onChange={(value) => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}
              className="min-w-[112px]"
              menuPlacement="top"
            />
            <Button
              variant="ghost"
              className="h-9 border border-(--color-accent)/45 px-3 text-xs"
              disabled={currentPage <= 1 || transactionsQuery.isPending}
              onClick={() => setCurrentPage((previousPage) => previousPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              className="h-9 border border-(--color-accent)/45 px-3 text-xs"
              disabled={currentPage >= totalPages || transactionsQuery.isPending}
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

      <Dialog
        isOpen={isTransferDialogOpen}
        onClose={() => {
          if (!createTransferMutation.isPending) {
            setIsTransferDialogOpen(false)
          }
        }}
        title="Create transfer"
        description="Move funds to a customer wallet."
        maxWidthClassName="max-w-md"
      >
        <form className="space-y-3" onSubmit={handleTransferSubmit}>
          <label className="space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              Customer wallet ID
            </span>
            <Input
              value={transferCustomerWalletId}
              onChange={(event) => setTransferCustomerWalletId(event.target.value)}
              required
              className="h-10 bg-(--color-card)"
              placeholder="Wallet UUID"
            />
          </label>

          <label className="space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              Amount
            </span>
            <Input
              value={transferAmount}
              onChange={(event) => setTransferAmount(event.target.value)}
              required
              className="h-10 bg-(--color-card)"
              placeholder="100.00"
              inputMode="decimal"
            />
          </label>

          <label className="space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              Reason (optional)
            </span>
            <Input
              value={transferReason}
              onChange={(event) => setTransferReason(event.target.value)}
              className="h-10 bg-(--color-card)"
              placeholder="Bonus payment"
            />
          </label>

          {createTransferMutation.isError ? (
            <p className="[font-family:var(--font-body)] text-sm text-rose-600">
              {createTransferMutation.error.message}
            </p>
          ) : null}

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 border border-(--color-accent)/45 px-3 text-xs"
              onClick={() => setIsTransferDialogOpen(false)}
              disabled={createTransferMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10 px-3 text-xs" disabled={createTransferMutation.isPending}>
              {createTransferMutation.isPending ? 'Creating...' : 'Create transfer'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isRefundDialogOpen}
        onClose={() => {
          if (!createRefundMutation.isPending) {
            setIsRefundDialogOpen(false)
          }
        }}
        title="Create refund"
        description="Return money to a customer wallet."
        maxWidthClassName="max-w-md"
      >
        <form className="space-y-3" onSubmit={handleRefundSubmit}>
          <label className="space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              Customer wallet ID
            </span>
            <Input
              value={refundCustomerWalletId}
              onChange={(event) => setRefundCustomerWalletId(event.target.value)}
              required
              className="h-10 bg-(--color-card)"
              placeholder="Wallet UUID"
            />
          </label>

          <label className="space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              Amount
            </span>
            <Input
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              required
              className="h-10 bg-(--color-card)"
              placeholder="50.00"
              inputMode="decimal"
            />
          </label>

          <label className="space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              Original transaction ID
            </span>
            <Input
              value={refundOfTransactionId}
              onChange={(event) => setRefundOfTransactionId(event.target.value)}
              required
              className="h-10 bg-(--color-card)"
              placeholder="Original payin transaction UUID"
            />
          </label>

          <label className="space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
              Reason (optional)
            </span>
            <Input
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              className="h-10 bg-(--color-card)"
              placeholder="Duplicate charge"
            />
          </label>

          {createRefundMutation.isError ? (
            <p className="[font-family:var(--font-body)] text-sm text-rose-600">
              {createRefundMutation.error.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 border border-(--color-accent)/45 px-3 text-xs"
              onClick={() => setIsRefundDialogOpen(false)}
              disabled={createRefundMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10 px-3 text-xs" disabled={createRefundMutation.isPending}>
              {createRefundMutation.isPending ? 'Creating...' : 'Create refund'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={Boolean(selectedTransactionId)}
        onClose={() => setSelectedTransactionId(null)}
        title="Transaction details"
        description={
          selectedTransactionId
            ? `Details for ${selectedTransactionId}`
            : 'Transaction details'
        }
        maxWidthClassName="max-w-xl"
      >
        {transactionDetailQuery.isPending ? (
          <div className="flex min-h-[140px] items-center justify-center">
            <LoadingSpinner label="Loading details..." />
          </div>
        ) : transactionDetailQuery.isError ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            {transactionDetailQuery.error.message}
          </p>
        ) : transactionDetailQuery.data ? (
          <div className="space-y-2 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
            <p>
              <span className="font-semibold text-(--color-secondary)">ID:</span>{' '}
              {transactionDetailQuery.data.id}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">Type:</span>{' '}
              {toTitleCase(transactionDetailQuery.data.type)}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">Status:</span>{' '}
              {toTitleCase(transactionDetailQuery.data.status)}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">Amount:</span>{' '}
              {formatMoney(transactionDetailQuery.data.amount)}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">Paid:</span>{' '}
              {formatMoney(
                transactionDetailQuery.data.paidAmount ||
                  transactionDetailQuery.data.amount,
              )}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">
                Customer wallet:
              </span>{' '}
              {transactionDetailQuery.data.customerWalletId || '-'}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">
                Platform order:
              </span>{' '}
              {transactionDetailQuery.data.platformOrderId || '-'}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">Created:</span>{' '}
              {formatDate(transactionDetailQuery.data.createdAt)}
            </p>
            <p>
              <span className="font-semibold text-(--color-secondary)">
                Completed:
              </span>{' '}
              {transactionDetailQuery.data.completedAt
                ? formatDate(transactionDetailQuery.data.completedAt)
                : '-'}
        </p>
      </div>
        ) : null}
      </Dialog>
    </section>
  )
}
