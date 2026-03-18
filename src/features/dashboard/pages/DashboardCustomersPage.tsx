import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import {
  useCreateCustomerMutation,
  useCustomerDetailQuery,
  useCustomerTransactionsQuery,
  useCustomersListQuery,
  useUpdateCustomerStatusMutation,
} from '../hooks/useCustomersQueries.ts'
import type {
  CustomerItem,
  CustomerStatus,
} from '../services/customersSchemas.ts'

const statusFilterOptions = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
]

const pageSizeOptions = [
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
]

const statusUpdateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
]

const txPageSizeOptions = [
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
]

function getCustomerStatusClassName(status: CustomerStatus) {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  if (status === 'frozen') {
    return 'bg-blue-100 text-blue-700'
  }
  return 'bg-rose-100 text-rose-700'
}

function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatMoney(currency: string, amountText: string) {
  const amountNumber = Number(amountText)
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function LoadingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
      {label}
    </span>
  )
}

export function DashboardCustomersPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageSize, setPageSize] = useState(20)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCustomerLabel, setNewCustomerLabel] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateLabelMissing, setIsCreateLabelMissing] = useState(false)

  const [customerForDetail, setCustomerForDetail] = useState<CustomerItem | null>(
    null,
  )
  const [customerForStatusUpdate, setCustomerForStatusUpdate] =
    useState<CustomerItem | null>(null)
  const [nextStatus, setNextStatus] = useState('active')
  const [statusReason, setStatusReason] = useState('')
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)

  const [customerForTransactions, setCustomerForTransactions] =
    useState<CustomerItem | null>(null)
  const [txCurrentPage, setTxCurrentPage] = useState(1)
  const [txPageSize, setTxPageSize] = useState(10)
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null)
  const [openActionsCustomerId, setOpenActionsCustomerId] = useState<string | null>(
    null,
  )
  const actionsMenuRef = useRef<HTMLDivElement | null>(null)

  const customersLimit = pageSize
  const customersQuery = useCustomersListQuery({
    limit: customersLimit,
    offset: 0,
    status:
      statusFilter === 'all' ? undefined : (statusFilter as CustomerStatus),
  })
  const createCustomerMutation = useCreateCustomerMutation()
  const updateCustomerStatusMutation = useUpdateCustomerStatusMutation()

  const detailQuery = useCustomerDetailQuery(customerForDetail?.id ?? null, true)

  const txOffset = (txCurrentPage - 1) * txPageSize
  const customerTransactionsQuery = useCustomerTransactionsQuery(
    customerForTransactions?.id ?? null,
    { limit: txPageSize, offset: txOffset },
    Boolean(customerForTransactions),
  )

  const customersData = customersQuery.data

  const txTotal = customerTransactionsQuery.data?.total ?? 0
  const txTotalPages = Math.max(1, Math.ceil(txTotal / txPageSize))

  const transactionsRows = useMemo(
    () => customerTransactionsQuery.data?.items ?? [],
    [customerTransactionsQuery.data],
  )

  useEffect(() => {
    setTxCurrentPage(1)
  }, [txPageSize, customerForTransactions?.id])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!actionsMenuRef.current) {
        return
      }
      if (!actionsMenuRef.current.contains(event.target as Node)) {
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

  async function handleCreateCustomer() {
    setCreateError(null)
    const normalizedLabel = newCustomerLabel.trim()
    if (!normalizedLabel) {
      setIsCreateLabelMissing(true)
      setCreateError('Customer label is required.')
      return
    }

    try {
      await createCustomerMutation.mutateAsync({
        label: normalizedLabel,
      })
      setNewCustomerLabel('')
      setIsCreateLabelMissing(false)
      setIsCreateDialogOpen(false)
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : 'Unable to create customer right now.',
      )
    }
  }

  async function handleUpdateCustomerStatus() {
    if (!customerForStatusUpdate) {
      return
    }
    setStatusUpdateError(null)
    try {
      await updateCustomerStatusMutation.mutateAsync({
        customerId: customerForStatusUpdate.id,
        payload: {
          status: nextStatus as CustomerStatus,
          reason: statusReason.trim() || undefined,
        },
      })
      setCustomerForStatusUpdate(null)
      setStatusReason('')
    } catch (error) {
      setStatusUpdateError(
        error instanceof Error
          ? error.message
          : 'Unable to update customer status right now.',
      )
    }
  }

  async function handleCopyCustomerId(customerId: string) {
    try {
      await navigator.clipboard.writeText(customerId)
      setCopiedCustomerId(customerId)
      window.setTimeout(() => setCopiedCustomerId(null), 1500)
    } catch {
      setCopiedCustomerId(null)
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <header className="relative z-20 rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
              Customers
            </h1>
            <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Manage customer wallets, statuses, and transaction activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownSelect
              ariaLabel="Filter customers by status"
              options={statusFilterOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <DropdownSelect
              ariaLabel="Select customers per page"
              options={pageSizeOptions}
              value={String(pageSize)}
              onChange={(value) => setPageSize(Number(value))}
              className="min-w-[108px]"
            />
            <Button className="h-10 px-3 text-xs" onClick={() => setIsCreateDialogOpen(true)}>
              Add customer
            </Button>
          </div>
        </div>
      </header>

      <section className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--color-accent)/45 bg-(--color-card)">
        <div className="hidden grid-cols-[minmax(220px,1.8fr)_minmax(120px,1fr)_minmax(90px,0.8fr)_minmax(140px,1.1fr)_120px] gap-3 border-b border-(--color-accent)/35 px-5 py-3 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-wide text-(--color-secondary) lg:grid">
          <p>Customer</p>
          <p>Balance</p>
          <p>Status</p>
          <p>Created</p>
          <p>Actions</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {customersQuery.isPending ? (
            <div className="flex h-full items-center justify-center px-5 py-8">
              <LoadingSpinner label="Loading customers..." />
            </div>
          ) : customersQuery.isError || !customersData ? (
            <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-rose-600">
              Unable to load customers right now.
            </div>
          ) : customersData.items.length === 0 ? (
            <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              No customers found for the selected filter.
            </div>
          ) : (
            customersData.items.map((customer) => (
              <article
                key={customer.id}
                className={`relative grid gap-2 border-b border-(--color-accent)/25 px-5 py-3 last:border-b-0 lg:grid-cols-[minmax(220px,1.8fr)_minmax(120px,1fr)_minmax(90px,0.8fr)_minmax(140px,1.1fr)_120px] lg:items-center lg:gap-3 ${
                  openActionsCustomerId === customer.id ? 'z-70' : 'z-0'
                }`}
              >
                <div>
                  <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
                    {customer.label || 'Unnamed customer'}
                  </p>
                  <div className="mt-0.5 inline-flex items-center gap-1.5">
                    <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {customer.id}
                    </p>
                    <button
                      type="button"
                      aria-label="Copy customer ID"
                      className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-(--color-secondary) transition hover:bg-(--color-background) hover:text-(--color-foreground)"
                      onClick={() => handleCopyCustomerId(customer.id)}
                    >
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                        <path d="M7 2.75A2.25 2.25 0 0 0 4.75 5v7.25A2.25 2.25 0 0 0 7 14.5h7.25a2.25 2.25 0 0 0 2.25-2.25V5A2.25 2.25 0 0 0 14.25 2.75H7Zm-.75 2.5c0-.41.34-.75.75-.75h7.25c.41 0 .75.34.75.75v7.25a.75.75 0 0 1-.75.75H7a.75.75 0 0 1-.75-.75V5.25ZM3.5 6.75a.75.75 0 0 1 .75.75v8.25c0 .41.34.75.75.75h8.25a.75.75 0 0 1 0 1.5H5a2.25 2.25 0 0 1-2.25-2.25V7.5a.75.75 0 0 1 .75-.75Z" />
                      </svg>
                    </button>
                    {copiedCustomerId === customer.id ? (
                      <span className="[font-family:var(--font-body)] text-[11px] text-emerald-700">
                        Copied
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                  {formatMoney(customer.currency, customer.balance)}
                </p>

                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-xs font-semibold ${getCustomerStatusClassName(
                      customer.status,
                    )}`}
                  >
                    {toTitleCaseFromSnake(customer.status)}
                  </span>
                </div>

                <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                  {formatDateTime(customer.createdAt)}
                </p>

                <div
                  className="relative inline-flex lg:justify-self-end"
                  ref={openActionsCustomerId === customer.id ? actionsMenuRef : null}
                >
                  <button
                    type="button"
                    aria-label="Open customer actions"
                    aria-expanded={openActionsCustomerId === customer.id}
                    onClick={() =>
                      setOpenActionsCustomerId((previousValue) =>
                        previousValue === customer.id ? null : customer.id,
                      )
                    }
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-accent)/45 bg-(--color-card) text-(--color-foreground) transition hover:border-(--color-secondary)/55 focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M10 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                    </svg>
                  </button>

                  {openActionsCustomerId === customer.id ? (
                    <div className="absolute right-full top-0 z-80 mr-2 w-44 overflow-hidden rounded-xl border border-(--color-accent)/45 bg-white">
                      <div className="divide-y divide-(--color-accent)/25">
                        <button
                          type="button"
                          className="block w-full cursor-pointer bg-white px-3 py-2.5 text-left [font-family:var(--font-body)] text-sm text-(--color-foreground) transition hover:bg-(--color-primary) hover:text-(--color-background)"
                          onClick={() => {
                            setCustomerForDetail(customer)
                            setOpenActionsCustomerId(null)
                          }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="block w-full cursor-pointer bg-white px-3 py-2.5 text-left [font-family:var(--font-body)] text-sm text-(--color-foreground) transition hover:bg-(--color-primary) hover:text-(--color-background)"
                          onClick={() => {
                            setCustomerForStatusUpdate(customer)
                            setNextStatus(customer.status)
                            setStatusReason('')
                            setStatusUpdateError(null)
                            setOpenActionsCustomerId(null)
                          }}
                        >
                          Update status
                        </button>
                        <button
                          type="button"
                          className="block w-full cursor-pointer bg-white px-3 py-2.5 text-left [font-family:var(--font-body)] text-sm text-(--color-foreground) transition hover:bg-(--color-primary) hover:text-(--color-background)"
                          onClick={() => {
                            setCustomerForTransactions(customer)
                            setOpenActionsCustomerId(null)
                          }}
                        >
                          Transactions
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>

      </section>

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          if (!createCustomerMutation.isPending) {
            setIsCreateDialogOpen(false)
          }
        }}
        title="Create customer"
        description="Create a new customer wallet."
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="px-4"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="px-4"
              onClick={handleCreateCustomer}
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? (
                <LoadingButtonLabel label="Creating..." />
              ) : (
                'Create customer'
              )}
            </Button>
          </div>
        }
      >
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
            Label *
          </span>
          <Input
            placeholder="John Doe"
            value={newCustomerLabel}
            onChange={(event) => {
              setNewCustomerLabel(event.target.value)
              if (isCreateLabelMissing) {
                setIsCreateLabelMissing(false)
              }
            }}
            className={
              isCreateLabelMissing
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300/40'
                : undefined
            }
          />
        </label>
        {createError ? (
          <p className="mt-3 [font-family:var(--font-body)] text-sm text-rose-600">
            {createError}
          </p>
        ) : null}
      </Dialog>

      <Dialog
        isOpen={Boolean(customerForDetail)}
        onClose={() => setCustomerForDetail(null)}
        title="Customer details"
        description="Wallet information for this customer."
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex items-center justify-end">
            <Button variant="ghost" className="px-4" onClick={() => setCustomerForDetail(null)}>
              Close
            </Button>
          </div>
        }
      >
        {detailQuery.isPending ? (
          <div className="flex min-h-[150px] items-center justify-center">
            <LoadingSpinner label="Loading customer..." />
          </div>
        ) : detailQuery.isError || !detailQuery.data ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            Unable to load customer details right now.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                Label
              </p>
              <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {detailQuery.data.label || 'Unnamed customer'}
              </p>
            </div>
            <div>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                Status
              </p>
              <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {toTitleCaseFromSnake(detailQuery.data.status)}
              </p>
            </div>
            <div>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                Balance
              </p>
              <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {formatMoney(detailQuery.data.currency, detailQuery.data.balance)}
              </p>
            </div>
            <div>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                Created
              </p>
              <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {formatDateTime(detailQuery.data.createdAt)}
              </p>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={Boolean(customerForStatusUpdate)}
        onClose={() => setCustomerForStatusUpdate(null)}
        title="Update customer status"
        description="Change operational status for this wallet."
        maxWidthClassName="max-w-lg min-h-[380px]"
        contentClassName="overflow-visible"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="px-4"
              onClick={() => setCustomerForStatusUpdate(null)}
              disabled={updateCustomerStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="px-4"
              onClick={handleUpdateCustomerStatus}
              disabled={updateCustomerStatusMutation.isPending}
            >
              {updateCustomerStatusMutation.isPending ? (
                <LoadingButtonLabel label="Updating..." />
              ) : (
                'Update status'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Status
            </span>
            <DropdownSelect
              ariaLabel="Update customer status"
              options={statusUpdateOptions}
              value={nextStatus}
              onChange={setNextStatus}
              className="relative z-70 w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Reason (optional)
            </span>
            <Input
              placeholder="Fraud investigation"
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
            />
          </label>
          {statusUpdateError ? (
            <p className="[font-family:var(--font-body)] text-sm text-rose-600">
              {statusUpdateError}
            </p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        isOpen={Boolean(customerForTransactions)}
        onClose={() => setCustomerForTransactions(null)}
        title="Customer transactions"
        description={`Transactions for ${customerForTransactions?.label || 'customer wallet'}.`}
        maxWidthClassName="max-w-4xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
            <p>
              Showing {txTotal === 0 ? 0 : txOffset + 1}-
              {Math.min(txOffset + txPageSize, txTotal)} of {txTotal}
            </p>
            <div className="flex items-center gap-2">
              <DropdownSelect
                ariaLabel="Select transactions per page"
                options={txPageSizeOptions}
                value={String(txPageSize)}
                onChange={(value) => setTxPageSize(Number(value))}
                className="min-w-[108px]"
                menuPlacement="top"
              />
              <Button
                variant="ghost"
                className="h-9 border border-(--color-accent)/45 px-3 text-xs"
                disabled={txCurrentPage <= 1}
                onClick={() => setTxCurrentPage((previousPage) => previousPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                className="h-9 border border-(--color-accent)/45 px-3 text-xs"
                disabled={txCurrentPage >= txTotalPages}
                onClick={() => setTxCurrentPage((previousPage) => previousPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        }
      >
        {customerTransactionsQuery.isPending ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner label="Loading transactions..." />
          </div>
        ) : customerTransactionsQuery.isError || !customerTransactionsQuery.data ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            Unable to load customer transactions right now.
          </p>
        ) : transactionsRows.length === 0 ? (
          <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
            No transactions found for this customer.
          </p>
        ) : (
          <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card)">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 border-b border-(--color-accent)/35 px-3 py-2 [font-family:var(--font-body)] text-[11px] uppercase tracking-wide text-(--color-secondary)">
              <p>Reference</p>
              <p>Type</p>
              <p>Amount</p>
              <p>Status</p>
              <p>Created</p>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {transactionsRows.map((tx, index) => (
                <div
                  key={`${tx.id ?? 'tx'}-${index}`}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 border-b border-(--color-accent)/20 px-3 py-2.5 [font-family:var(--font-body)] text-sm text-(--color-foreground) last:border-b-0"
                >
                  <p className="truncate">{tx.reference || tx.id || '-'}</p>
                  <p>{tx.type || '-'}</p>
                  <p>{tx.amount || '-'}</p>
                  <p>{tx.status || '-'}</p>
                  <p className="text-xs text-(--color-secondary)">
                    {tx.createdAt ? formatDateTime(tx.createdAt) : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}
