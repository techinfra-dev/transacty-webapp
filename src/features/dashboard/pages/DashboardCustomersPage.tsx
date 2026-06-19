import { useEffect, useMemo, useState } from 'react'
import { FormattedMoney } from '../../../components/ui/FormattedMoney.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
import { CustomersFilterBar } from '../components/customers/CustomersFilterBar.tsx'
import { CustomersPageHeader } from '../components/customers/CustomersPageHeader.tsx'
import { CustomersStatsStrip } from '../components/customers/CustomersStatsStrip.tsx'
import { CustomersTableSection } from '../components/customers/CustomersTableSection.tsx'
import {
  formatDateTime,
  LoadingButtonLabel,
  statusUpdateOptions,
  toTitleCaseFromSnake,
  txPageSizeOptions,
} from '../components/customers/customerViewUtils.tsx'
import { RefundTransactionDialog } from '../components/transactions/RefundTransactionDialog.tsx'
import { TransferTransactionDialog } from '../components/transactions/TransferTransactionDialog.tsx'
import {
  getTransactionFeeColumnDisplay,
} from '../components/transactions/transactionAmountUtils.ts'
import { formatTransactionMoney } from '../components/transactions/transactionFormatters.ts'
import {
  useCreateCustomerMutation,
  useCustomerDetailQuery,
  useCustomerTransactionsQuery,
  useUpdateCustomerStatusMutation,
} from '../hooks/useCustomersQueries.ts'
import { useCustomersPage } from '../hooks/useCustomersPage.ts'
import { useTransferRefundActions } from '../hooks/useTransferRefundActions.ts'
import type { CustomerItem, CustomerStatus } from '../services/customersSchemas.ts'
import type { TransactionItem } from '../services/transactionsSchemas.ts'

export function DashboardCustomersPage() {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const page = useCustomersPage()
  const moneyActions = useTransferRefundActions()
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCustomerLabel, setNewCustomerLabel] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateLabelMissing, setIsCreateLabelMissing] = useState(false)

  const [customerForDetail, setCustomerForDetail] = useState<CustomerItem | null>(null)
  const [customerForStatusUpdate, setCustomerForStatusUpdate] =
    useState<CustomerItem | null>(null)
  const [nextStatus, setNextStatus] = useState('active')
  const [statusReason, setStatusReason] = useState('')
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)

  const [customerForTransactions, setCustomerForTransactions] =
    useState<CustomerItem | null>(null)
  const [txCurrentPage, setTxCurrentPage] = useState(1)
  const [txPageSize, setTxPageSize] = useState(10)

  const createCustomerMutation = useCreateCustomerMutation()
  const updateCustomerStatusMutation = useUpdateCustomerStatusMutation()
  const detailQuery = useCustomerDetailQuery(customerForDetail?.id ?? null, true)

  const txOffset = (txCurrentPage - 1) * txPageSize
  const customerTransactionsQuery = useCustomerTransactionsQuery(
    customerForTransactions?.id ?? null,
    { limit: txPageSize, offset: txOffset },
    Boolean(customerForTransactions),
  )

  const txTotal = customerTransactionsQuery.data?.total ?? 0
  const txTotalPages = Math.max(1, Math.ceil(txTotal / txPageSize))
  const transactionsRows = useMemo(
    () => customerTransactionsQuery.data?.items ?? [],
    [customerTransactionsQuery.data],
  )

  useEffect(() => {
    setTxCurrentPage(1)
  }, [txPageSize, customerForTransactions?.id])

  const emptyMessage =
    portalEnvironment === 'live' && page.totalItems === 0 && !page.customersQuery.isPending
      ? 'No live customers yet.'
      : 'No customers match your filters.'

  async function handleCreateCustomer() {
    setCreateError(null)
    const normalizedLabel = newCustomerLabel.trim()
    if (!normalizedLabel) {
      setIsCreateLabelMissing(true)
      setCreateError('Customer label is required.')
      return
    }

    try {
      await createCustomerMutation.mutateAsync({ label: normalizedLabel })
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

  return (
    <section className="customers-page app-page-enter flex h-full min-h-0 flex-col gap-3">
      <CustomersPageHeader onCreate={() => setIsCreateDialogOpen(true)} />

      <CustomersStatsStrip
        total={page.statusCounts.total}
        active={page.statusCounts.active}
        frozen={page.statusCounts.frozen}
        closed={page.statusCounts.closed}
        balancesByCurrency={page.totalBalanceQuery.data?.byCurrency ?? []}
        isCountsLoading={page.statusCounts.isLoading}
        isBalanceLoading={page.totalBalanceQuery.isPending}
      />

      <CustomersFilterBar
        searchQuery={page.searchQuery}
        onSearchQueryChange={page.setSearchQuery}
        statusFilter={page.statusFilter}
        onStatusFilterChange={page.setStatusFilter}
        pageSize={page.pageSize}
        onPageSizeChange={page.setPageSize}
      />

      <CustomersTableSection
        customersQuery={page.customersQuery}
        items={page.displayedItems}
        emptyMessage={emptyMessage}
        startItem={page.startItem}
        endItem={page.endItem}
        totalItems={page.totalItems}
        pageSize={page.pageSize}
        currentPage={page.currentPage}
        totalPages={page.totalPages}
        copiedCustomerId={page.copiedCustomerId}
        openActionsCustomerId={page.openActionsCustomerId}
        actionsMenuRef={page.actionsMenuRef}
        isLiveEnvironment={portalEnvironment === 'live'}
        onPageSizeChange={page.setPageSize}
        onPreviousPage={() => page.setCurrentPage((p) => p - 1)}
        onNextPage={() => page.setCurrentPage((p) => p + 1)}
        onCopyCustomerId={(id) => void page.copyCustomerId(id)}
        onToggleActions={page.toggleActions}
        onView={setCustomerForDetail}
        onUpdateStatus={(customer) => {
          setCustomerForStatusUpdate(customer)
          setNextStatus(customer.status)
          setStatusReason('')
          setStatusUpdateError(null)
        }}
        onTransactions={setCustomerForTransactions}
        onTransfer={(customer) => moneyActions.openTransferForCustomer(customer.id)}
        onRefund={(customer) => moneyActions.openRefundForCustomer(customer.id)}
      />

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
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              className="h-10 w-full px-4 text-xs"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="h-10 w-full px-4 text-xs"
              onClick={() => void handleCreateCustomer()}
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? (
                <LoadingButtonLabel label="Creating…" />
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
            <LoadingSpinner label="Loading customer…" />
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
                <FormattedMoney
                  currency={detailQuery.data.currency}
                  value={Number(detailQuery.data.balance) || 0}
                />
              </p>
            </div>
            <div>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                Created
              </p>
              <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {formatDateTime(detailQuery.data.createdAt).primary}
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
        maxWidthClassName="max-w-lg"
        allowOverflow
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              className="h-10 w-full px-4 text-xs"
              onClick={() => setCustomerForStatusUpdate(null)}
              disabled={updateCustomerStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="h-10 w-full px-4 text-xs"
              onClick={() => void handleUpdateCustomerStatus()}
              disabled={updateCustomerStatusMutation.isPending}
            >
              {updateCustomerStatusMutation.isPending ? (
                <LoadingButtonLabel label="Updating…" />
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
              className="dialog-field-select relative z-70 w-full"
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
              Showing {txTotal === 0 ? 0 : txOffset + 1}–
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
                onClick={() => setTxCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                className="h-9 border border-(--color-accent)/45 px-3 text-xs"
                disabled={txCurrentPage >= txTotalPages}
                onClick={() => setTxCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        }
      >
        {customerTransactionsQuery.isPending ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner label="Loading transactions…" />
          </div>
        ) : customerTransactionsQuery.isError ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            Unable to load customer transactions right now.
          </p>
        ) : transactionsRows.length === 0 ? (
          <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
            No transactions found for this customer.
          </p>
        ) : (
          <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card)">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.9fr_0.8fr_0.8fr_1fr] gap-2 border-b border-(--color-accent)/35 px-3 py-2 [font-family:var(--font-body)] text-[11px] uppercase tracking-wide text-(--color-secondary)">
              <p>Reference</p>
              <p>Type</p>
              <p>Amount</p>
              <p>Fee</p>
              <p>Status</p>
              <p>Created</p>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {transactionsRows.map((tx, index) => {
                const txId = tx.id?.trim()
                const canOpenDetail = Boolean(txId)
                const created = tx.createdAt
                  ? formatDateTime(tx.createdAt)
                  : { primary: '—', secondary: '' }
                const feeColumn = getTransactionFeeColumnDisplay(
                  tx as TransactionItem,
                )
                return (
                  <div
                    key={`${tx.id ?? 'tx'}-${index}`}
                    role={canOpenDetail ? 'button' : undefined}
                    tabIndex={canOpenDetail ? 0 : undefined}
                    className={`grid grid-cols-[1.1fr_0.8fr_0.9fr_0.8fr_0.8fr_1fr] gap-2 border-b border-(--color-accent)/20 px-3 py-2.5 [font-family:var(--font-body)] text-sm text-(--color-foreground) last:border-b-0 ${
                      canOpenDetail
                        ? 'cursor-pointer hover:bg-[#F2EFE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0700]/15'
                        : ''
                    }`}
                    onClick={
                      canOpenDetail
                        ? () => openTransactionDetail(txId as string)
                        : undefined
                    }
                    onKeyDown={
                      canOpenDetail
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openTransactionDetail(txId as string)
                            }
                          }
                        : undefined
                    }
                  >
                    <p className="truncate">{tx.reference || tx.id || '—'}</p>
                    <p>{tx.type || '—'}</p>
                    <p>{tx.amount || '—'}</p>
                    <p>
                      {feeColumn.hasFee && feeColumn.value
                        ? formatTransactionMoney(
                            feeColumn.value,
                            feeColumn.currency,
                          )
                        : '—'}
                    </p>
                    <p>{tx.status || '—'}</p>
                    <p className="text-xs text-(--color-secondary)">{created.primary}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Dialog>

      <TransferTransactionDialog
        isOpen={moneyActions.isTransferDialogOpen}
        onClose={() => moneyActions.setIsTransferDialogOpen(false)}
        customerWalletId={moneyActions.transferCustomerWalletId}
        amount={moneyActions.transferAmount}
        onAmountChange={moneyActions.setTransferAmount}
        reason={moneyActions.transferReason}
        onReasonChange={moneyActions.setTransferReason}
        mutation={moneyActions.createTransferMutation}
        onSubmit={moneyActions.handleTransferSubmit}
      />

      <RefundTransactionDialog
        isOpen={moneyActions.isRefundDialogOpen}
        onClose={() => moneyActions.setIsRefundDialogOpen(false)}
        customerWalletId={moneyActions.refundCustomerWalletId}
        amount={moneyActions.refundAmount}
        onAmountChange={moneyActions.setRefundAmount}
        refundOfTransactionId={moneyActions.refundOfTransactionId}
        onRefundOfTransactionIdChange={moneyActions.setRefundOfTransactionId}
        reason={moneyActions.refundReason}
        onReasonChange={moneyActions.setRefundReason}
        mutation={moneyActions.createRefundMutation}
        onSubmit={moneyActions.handleRefundSubmit}
      />

      <Dialog
        isOpen={moneyActions.liveMoneyConfirm !== null}
        onClose={() => {
          if (
            !moneyActions.createTransferMutation.isPending &&
            !moneyActions.createRefundMutation.isPending
          ) {
            moneyActions.setLiveMoneyConfirm(null)
          }
        }}
        title={
          moneyActions.liveMoneyConfirm === 'refund'
            ? 'Confirm live refund'
            : 'Confirm live transfer'
        }
        description={
          moneyActions.liveMoneyConfirm === 'refund'
            ? 'This refund will be processed in the live environment and may affect real customer balances.'
            : 'This transfer will be processed in the live environment and may move real funds.'
        }
        maxWidthClassName="max-w-md"
        footer={
          <div className="dialog-action-row grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full px-3 text-xs"
              disabled={
                moneyActions.createTransferMutation.isPending ||
                moneyActions.createRefundMutation.isPending
              }
              onClick={() => moneyActions.setLiveMoneyConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 w-full px-3 text-xs"
              disabled={
                moneyActions.createTransferMutation.isPending ||
                moneyActions.createRefundMutation.isPending
              }
              onClick={() => {
                if (moneyActions.liveMoneyConfirm === 'refund') {
                  void moneyActions.executeRefund()
                } else {
                  void moneyActions.executeTransfer()
                }
              }}
            >
              {moneyActions.createTransferMutation.isPending ||
              moneyActions.createRefundMutation.isPending
                ? 'Submitting…'
                : 'Confirm'}
            </Button>
          </div>
        }
      />
    </section>
  )
}
