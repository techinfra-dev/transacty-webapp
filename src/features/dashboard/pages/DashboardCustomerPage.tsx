import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../components/ui/DropdownSelect.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { PortalEnvironmentBadge } from '../../../components/ui/PortalEnvironmentBadge.tsx'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
import { Route } from '../../../routes/dashboard.customers.$customerId.tsx'
import { CustomerDetailActivityList } from '../components/customers/CustomerDetailActivityList.tsx'
import { CustomerDetailOverview } from '../components/customers/CustomerDetailOverview.tsx'
import { CustomerUpdateStatusDialog } from '../components/customers/CustomerUpdateStatusDialog.tsx'
import {
  customerDetailTabs,
  type CustomerDetailTabId,
} from '../components/customers/customerDetailTabs.ts'
import {
  formatDateTime,
  getCustomerShortId,
  getCustomerStatusPillClassName,
  getCustomerWalletTitle,
  getMarketNameForCurrency,
  LoadingButtonLabel,
  toTitleCaseFromSnake,
  txPageSizeOptions,
} from '../components/customers/customerViewUtils.tsx'
import { RefundTransactionDialog } from '../components/transactions/RefundTransactionDialog.tsx'
import { TransferTransactionDialog } from '../components/transactions/TransferTransactionDialog.tsx'
import { TransactionsTableSection } from '../components/transactions/TransactionsTableSection.tsx'
import { useCustomerScopedTransactionsPage } from '../hooks/useCustomerScopedTransactionsPage.ts'
import {
  useCustomerDetailQuery,
  useCustomerTransactionsQuery,
  useUpdateCustomerStatusMutation,
} from '../hooks/useCustomersQueries.ts'
import { useTransferRefundActions } from '../hooks/useTransferRefundActions.ts'
import type { CustomerStatus } from '../services/customersSchemas.ts'

const outlineBtn = 'dash-btn-outline'

const phosphorIconProps = {
  viewBox: '0 0 256 256',
  fill: 'currentColor',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
}

/** Iconify Phosphor: ph:copy-simple-bold */
function CopyGlyph() {
  return (
    <svg {...phosphorIconProps} className="h-3.5 w-3.5">
      <path d="M180 64H40a12 12 0 0 0-12 12v140a12 12 0 0 0 12 12h140a12 12 0 0 0 12-12V76a12 12 0 0 0-12-12m-12 140H52V88h116Zm60-164v140a12 12 0 0 1-24 0V52H76a12 12 0 0 1 0-24h140a12 12 0 0 1 12 12" />
    </svg>
  )
}

/** Iconify Phosphor: ph:arrows-left-right-bold */
function TransferGlyph() {
  return (
    <svg {...phosphorIconProps} className="h-4 w-4">
      <path d="m216.49 184.49l-32 32a12 12 0 0 1-17-17L179 188H48a12 12 0 0 1 0-24h131l-11.52-11.51a12 12 0 0 1 17-17l32 32a12 12 0 0 1 .01 17m-145-64a12 12 0 0 0 17-17L77 92h131a12 12 0 0 0 0-24H77l11.49-11.51a12 12 0 0 0-17-17l-32 32a12 12 0 0 0 0 17Z" />
    </svg>
  )
}

/** Iconify Phosphor: ph:wallet-bold */
function WalletGlyph() {
  return (
    <svg {...phosphorIconProps} className="h-5 w-5">
      <path d="M196 136a16 16 0 1 1-16-16a16 16 0 0 1 16 16m40-36v80a32 32 0 0 1-32 32H60a32 32 0 0 1-32-32V60.92A32 32 0 0 1 60 28h132a12 12 0 0 1 0 24H60a8 8 0 0 0-8 8.26v.08A8.32 8.32 0 0 0 60.48 68H204a32 32 0 0 1 32 32m-24 0a8 8 0 0 0-8-8H60.48A33.7 33.7 0 0 1 52 90.92V180a8 8 0 0 0 8 8h144a8 8 0 0 0 8-8Z" />
    </svg>
  )
}

export function DashboardCustomerPage() {
  const { customerId } = useParams({ from: '/dashboard/customers/$customerId' })
  const { tab: tabFromSearch } = Route.useSearch()
  const navigate = useNavigate()
  const { canWriteMoney } = usePortalRole()
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const moneyActions = useTransferRefundActions()
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )

  const activeTab: CustomerDetailTabId = tabFromSearch ?? 'overview'

  const detailQuery = useCustomerDetailQuery(customerId, true)
  const updateCustomerStatusMutation = useUpdateCustomerStatusMutation()

  const [nextStatus, setNextStatus] = useState('active')
  const [statusReason, setStatusReason] = useState('')
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)
  const [statusSavedFlash, setStatusSavedFlash] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const [activityCurrentPage, setActivityCurrentPage] = useState(1)
  const [activityPageSize, setActivityPageSize] = useState(10)
  const activityOffset = (activityCurrentPage - 1) * activityPageSize
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<CustomerDetailTabId, HTMLButtonElement>>>(
    {},
  )
  const [tabIndicator, setTabIndicator] = useState({ width: 0, x: 0 })

  const overviewTxQuery = useCustomerTransactionsQuery(
    customerId,
    { limit: 50, offset: 0 },
    true,
  )

  const activityTransactionsQuery = useCustomerTransactionsQuery(
    customerId,
    { limit: activityPageSize, offset: activityOffset },
    activeTab === 'activity',
  )

  const scopedTx = useCustomerScopedTransactionsPage(
    customerId,
    activeTab === 'transactions',
  )

  const listTotal =
    scopedTx.allCount ||
    overviewTxQuery.data?.total ||
    detailQuery.data?.txSummary?.totalCount ||
    overviewTxQuery.data?.items.length ||
    0
  const activityTotal = activityTransactionsQuery.data?.total ?? listTotal
  const activityTotalPages = Math.max(
    1,
    Math.ceil(activityTotal / activityPageSize),
  )
  const activityRows = useMemo(
    () => activityTransactionsQuery.data?.items ?? [],
    [activityTransactionsQuery.data],
  )

  const overviewItems = useMemo(() => {
    if ((detailQuery.data?.recentTransactions?.length ?? 0) > 0) {
      return detailQuery.data?.recentTransactions ?? []
    }
    return overviewTxQuery.data?.items ?? []
  }, [detailQuery.data?.recentTransactions, overviewTxQuery.data?.items])

  const flowAndOutcomes = useMemo(() => {
    const items = overviewItems
    let credited = 0
    let debited = 0
    let creditCount = 0
    let debitCount = 0
    let success = detailQuery.data?.txSummary?.successCount
    let pending = detailQuery.data?.txSummary?.pendingCount
    let failed = detailQuery.data?.txSummary?.failedCount
    let earliest: string | null = null
    let latest: string | null = null

    if (
      typeof success !== 'number' ||
      typeof pending !== 'number' ||
      typeof failed !== 'number'
    ) {
      success = 0
      pending = 0
      failed = 0
      for (const tx of items) {
        const status = (tx.status ?? '').trim().toLowerCase()
        if (status === 'success') success += 1
        else if (status === 'pending') pending += 1
        else if (status === 'failed') failed += 1
      }
    }

    for (const tx of items) {
      const amount = Number(tx.amount)
      const safe = Number.isFinite(amount) ? Math.abs(amount) : 0
      const type = (tx.type ?? '').trim().toLowerCase()
      if (type === 'payout') {
        debited += safe
        debitCount += 1
      } else if (
        type === 'transfer' ||
        type === 'refund' ||
        type === 'payin'
      ) {
        credited += safe
        creditCount += 1
      }
      if (tx.createdAt) {
        if (!earliest || tx.createdAt < earliest) earliest = tx.createdAt
        if (!latest || tx.createdAt > latest) latest = tx.createdAt
      }
    }

    const total =
      typeof detailQuery.data?.txSummary?.totalCount === 'number'
        ? detailQuery.data.txSummary.totalCount
        : success + pending + failed

    let sinceLabel = 'No movements yet'
    if (earliest) {
      const date = new Date(earliest)
      if (!Number.isNaN(date.getTime())) {
        sinceLabel = `Since ${date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        })}`
      }
    }

    return {
      flow: { credited, debited, creditCount, debitCount, sinceLabel },
      outcomes: {
        success: success ?? 0,
        pending: pending ?? 0,
        failed: failed ?? 0,
        total,
      },
      lastActivityAt: latest,
      activityCount: total,
    }
  }, [detailQuery.data?.txSummary, overviewItems])

  useEffect(() => {
    setActivityCurrentPage(1)
  }, [activityPageSize, customerId, activeTab])

  useEffect(() => {
    if (detailQuery.data?.status) {
      setNextStatus(detailQuery.data.status)
    }
  }, [detailQuery.data?.status])

  useLayoutEffect(() => {
    const container = tabsContainerRef.current
    const activeButton = tabRefs.current[activeTab]
    if (!container || !activeButton) {
      return
    }

    const update = () => {
      const containerRect = container.getBoundingClientRect()
      const tabRect = activeButton.getBoundingClientRect()
      setTabIndicator({
        x: tabRect.left - containerRect.left,
        width: tabRect.width,
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    observer.observe(activeButton)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [activeTab, listTotal, scopedTx.allCount])

  function selectTab(tab: CustomerDetailTabId) {
    void navigate({
      to: '/dashboard/customers/$customerId',
      params: { customerId },
      search: { tab },
    })
  }

  async function copyCustomerId(id: string) {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(true)
      window.setTimeout(() => setCopiedId(false), 1400)
    } catch {
      setCopiedId(false)
    }
  }

  async function handleUpdateCustomerStatus() {
    setStatusUpdateError(null)
    setStatusSavedFlash(false)
    if (
      (nextStatus === 'frozen' || nextStatus === 'closed') &&
      statusReason.trim().length === 0
    ) {
      setStatusUpdateError('A reason is required for this status change.')
      return
    }
    try {
      await updateCustomerStatusMutation.mutateAsync({
        customerId,
        payload: {
          status: nextStatus as CustomerStatus,
          reason: statusReason.trim() || undefined,
        },
      })
      setStatusReason('')
      setStatusSavedFlash(true)
      window.setTimeout(() => {
        setIsStatusDialogOpen(false)
        setStatusSavedFlash(false)
      }, 700)
    } catch (error) {
      setStatusUpdateError(
        error instanceof Error
          ? error.message
          : 'Unable to update customer status right now.',
      )
    }
  }

  function openStatusDialog() {
    const current = detailQuery.data?.status ?? 'active'
    setNextStatus(current === 'active' ? 'frozen' : current === 'frozen' ? 'active' : current)
    setStatusReason('')
    setStatusUpdateError(null)
    setStatusSavedFlash(false)
    setIsStatusDialogOpen(true)
  }

  if (detailQuery.isPending) {
    return (
      <section className="app-page-enter flex min-h-[240px] items-center justify-center">
        <LoadingSpinner label="Loading customer…" />
      </section>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="app-page-enter dashboard-card max-w-lg p-6">
        <h1 className="dash-page-title">Customer not found</h1>
        <p className="dash-page-subtitle">
          This customer is not available in the current environment, or the link
          may be outdated.
        </p>
        <Link
          to="/dashboard/customers"
          className="dash-btn-outline mt-4 inline-flex items-center rounded-lg px-3 [font-family:var(--font-body)]"
        >
          Back to customers
        </Link>
      </section>
    )
  }

  const customer = detailQuery.data
  const balance = Number(customer.balance)
  const safeBalance = Number.isFinite(balance) ? balance : 0
  const currency = customer.currency.trim().toUpperCase()
  const walletTitle = getCustomerWalletTitle(customer)
  const market = getMarketNameForCurrency(currency)
  const created = formatDateTime(customer.createdAt)
  const environmentLabel = portalEnvironment === 'live' ? 'Live' : 'Test'
  const tabCounts = {
    transactions: scopedTx.allCount || listTotal,
    activity: listTotal,
  }

  return (
    <section className="customer-detail-page app-page-enter flex flex-col gap-4">
      <header className="cd-head">
        <div className="cd-head-main">
          <Link to="/dashboard/customers" className="cd-back">
            ← All customers
          </Link>

          <div className="cd-identity">
            <span className="cd-wallet-avatar" aria-hidden>
              <WalletGlyph />
            </span>
            <div className="min-w-0 flex-1">
              <div className="cd-title-row">
                <h1 className="cd-title">{walletTitle}</h1>
                <span className={getCustomerStatusPillClassName(customer.status)}>
                  {toTitleCaseFromSnake(customer.status)}
                </span>
              </div>
              <div className="cd-submeta">
                <button
                  type="button"
                  className="cd-id-chip"
                  onClick={() => void copyCustomerId(customer.id)}
                  title={customer.id}
                >
                  <span>{getCustomerShortId(customer.id)}</span>
                  <CopyGlyph />
                  {copiedId ? <span className="cd-copied">Copied</span> : null}
                </button>
                <span>
                  {currency} wallet · {market}
                </span>
                <span>
                  {created.primary}
                  {created.secondary ? ` · ${created.secondary}` : ''}
                </span>
                <PortalEnvironmentBadge environment={portalEnvironment} />
              </div>
            </div>
          </div>
        </div>

        <div className="cd-head-actions">
          <Button
            type="button"
            variant="ghost"
            className={outlineBtn}
            onClick={openStatusDialog}
          >
            Update status
          </Button>
          {canWriteMoney ? (
            <Button
              className="dash-btn-primary inline-flex items-center gap-2"
              onClick={() => moneyActions.openTransferForCustomer(customer.id)}
            >
              <TransferGlyph />
              New transfer
            </Button>
          ) : null}
        </div>
      </header>

      <div className="cd-shell dashboard-card">
        <nav className="customer-detail-tabs" aria-label="Customer sections">
          <div ref={tabsContainerRef} className="customer-detail-tabs-track">
            <span
              className="customer-detail-tab-indicator"
              style={{
                width: tabIndicator.width,
                transform: `translateX(${tabIndicator.x}px)`,
                opacity: tabIndicator.width > 0 ? 1 : 0,
              }}
              aria-hidden
            />
            {customerDetailTabs.map((tab) => {
              const isActive = tab.id === activeTab
              const count =
                tab.id === 'transactions'
                  ? tabCounts.transactions
                  : tab.id === 'activity'
                    ? tabCounts.activity
                    : null
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node ?? undefined
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`customer-detail-tab${isActive ? ' customer-detail-tab--active' : ''}`}
                  onClick={() => selectTab(tab.id)}
                >
                  {tab.label}
                  {count != null && count > 0 ? (
                    <span className="cd-tab-count">{count}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="customer-detail-panel" role="tabpanel">
          {activeTab === 'overview' ? (
            <div className="flex flex-col gap-5">
              {overviewTxQuery.isPending && overviewItems.length === 0 ? (
                <div className="flex min-h-[160px] items-center justify-center">
                  <LoadingSpinner label="Loading overview…" />
                </div>
              ) : (
                <CustomerDetailOverview
                  customer={customer}
                  currency={currency}
                  balance={safeBalance}
                  environmentLabel={environmentLabel}
                  flow={flowAndOutcomes.flow}
                  outcomes={flowAndOutcomes.outcomes}
                  lastActivityAt={flowAndOutcomes.lastActivityAt}
                />
              )}

              <section className="cd-recent">
                <div className="cd-recent-head">
                  <h2 className="cd-recent-title">Recent transfers</h2>
                  <button
                    type="button"
                    className="cd-view-all"
                    onClick={() => selectTab('transactions')}
                  >
                    View all →
                  </button>
                </div>
                <CustomerDetailActivityList
                  items={overviewItems.slice(0, 5)}
                  fallbackCurrency={currency}
                  onOpenTransaction={openTransactionDetail}
                  emptyMessage="No recent transfers yet."
                />
              </section>
            </div>
          ) : null}

          {activeTab === 'activity' ? (
            <div className="customer-detail-transactions">
              {activityTransactionsQuery.isPending ? (
                <div className="flex min-h-[180px] items-center justify-center">
                  <LoadingSpinner label="Loading activity…" />
                </div>
              ) : activityTransactionsQuery.isError ? (
                <p className="[font-family:var(--font-body)] text-sm text-rose-600">
                  Unable to load activity right now.
                </p>
              ) : (
                <CustomerDetailActivityList
                  items={activityRows}
                  fallbackCurrency={currency}
                  onOpenTransaction={openTransactionDetail}
                  emptyMessage="No activity for this customer."
                />
              )}
              <div className="customer-detail-tx-footer">
                <p>
                  Showing {activityTotal === 0 ? 0 : activityOffset + 1}–
                  {Math.min(activityOffset + activityPageSize, activityTotal)} of{' '}
                  {activityTotal}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <DropdownSelect
                    ariaLabel="Select activity per page"
                    options={txPageSizeOptions}
                    value={String(activityPageSize)}
                    onChange={(value) => setActivityPageSize(Number(value))}
                    className="min-w-[108px]"
                    menuPlacement="top"
                  />
                  <Button
                    variant="ghost"
                    className={outlineBtn}
                    disabled={activityCurrentPage <= 1}
                    onClick={() => setActivityCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    className={outlineBtn}
                    disabled={activityCurrentPage >= activityTotalPages}
                    onClick={() => setActivityCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'transactions' ? (
            <div className="cd-tx-table">
              <TransactionsTableSection
                transactionsQuery={scopedTx.transactionsQuery}
                statusTabs={scopedTx.statusTabs}
                statusTab={scopedTx.statusTab}
                onStatusTabChange={scopedTx.setStatusTab}
                filteredTransactions={scopedTx.filteredTransactions}
                startItem={scopedTx.startItem}
                endItem={scopedTx.endItem}
                totalItems={scopedTx.totalItems}
                pageSize={scopedTx.pageSize}
                currentPage={scopedTx.currentPage}
                totalPages={scopedTx.totalPages}
                onPageSizeChange={(value) => {
                  scopedTx.setPageSize(value)
                  scopedTx.setCurrentPage(1)
                }}
                onPreviousPage={() =>
                  scopedTx.setCurrentPage((previousPage) => previousPage - 1)
                }
                onNextPage={() =>
                  scopedTx.setCurrentPage((previousPage) => previousPage + 1)
                }
                isLiveEnvironment={portalEnvironment === 'live'}
              />
            </div>
          ) : null}
        </div>
      </div>

      <CustomerUpdateStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => {
          if (!updateCustomerStatusMutation.isPending) {
            setIsStatusDialogOpen(false)
            setStatusSavedFlash(false)
            setStatusUpdateError(null)
          }
        }}
        walletTitle={walletTitle}
        currency={currency}
        balance={safeBalance}
        currentStatus={customer.status}
        nextStatus={nextStatus}
        onNextStatusChange={setNextStatus}
        statusReason={statusReason}
        onStatusReasonChange={setStatusReason}
        isPending={updateCustomerStatusMutation.isPending}
        error={statusUpdateError}
        savedFlash={statusSavedFlash}
        onConfirm={() => void handleUpdateCustomerStatus()}
      />

      <TransferTransactionDialog
        isOpen={moneyActions.isTransferDialogOpen}
        onClose={() => moneyActions.setIsTransferDialogOpen(false)}
        customerWalletId={moneyActions.transferCustomerWalletId}
        walletTitle={walletTitle}
        currency={currency}
        balance={safeBalance}
        amount={moneyActions.transferAmount}
        onAmountChange={moneyActions.setTransferAmount}
        direction={moneyActions.transferDirection}
        onDirectionChange={moneyActions.setTransferDirection}
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
        lockTransactionId={moneyActions.refundTransactionLocked}
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
          <div className="grid grid-cols-2 gap-2">
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
              moneyActions.createRefundMutation.isPending ? (
                <LoadingButtonLabel label="Confirming…" />
              ) : (
                'Confirm'
              )}
            </Button>
          </div>
        }
      >
        <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
          Continue only if you intend to move live funds for this customer.
        </p>
      </Dialog>
    </section>
  )
}
