import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { usePortalEnvironmentStore } from '../../../../store/portalEnvironmentStore.ts'
import {
  useWalletActivityQueries,
  useWalletActivityStatusCounts,
} from '../../hooks/useWalletActivityQueries.ts'
import type { TransactionRailApi } from '../../services/transactionsSchemas.ts'
import {
  TransactionStatusTabs,
  type TransactionStatusTabId,
} from '../transactions/TransactionStatusTabs.tsx'
import { TransactionsFooter } from '../transactions/TransactionsFooter.tsx'
import { DashboardTransactionsTable } from '../DashboardTransactionsTable.tsx'

type WalletActivityTableProps = {
  currency: string
  walletLabel: string
  walletRail: TransactionRailApi | undefined
}

function emptyMessageForFilter(
  filter: TransactionStatusTabId,
  walletCurrency: string,
  walletLabel: string,
) {
  if (filter === 'all') {
    return `No ${walletCurrency} transactions found for ${walletLabel}.`
  }
  const label =
    filter === 'success'
      ? 'successful'
      : filter === 'pending'
        ? 'pending'
        : 'failed'
  return `No ${label} ${walletCurrency} transactions for ${walletLabel}.`
}

export function WalletActivityTable({
  currency,
  walletLabel,
  walletRail,
}: WalletActivityTableProps) {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const walletCurrency = currency.trim().toUpperCase()
  const canQuery = Boolean(walletRail && walletCurrency)
  const [statusFilter, setStatusFilter] = useState<TransactionStatusTabId>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setCurrentPage(1)
  }, [walletRail, walletCurrency, statusFilter])

  const statusCountsQuery = useWalletActivityStatusCounts({
    walletRail,
    walletCurrency,
    enabled: canQuery,
  })

  const { rows, totalItems, transactionsQuery } = useWalletActivityQueries({
    walletRail,
    walletCurrency,
    statusFilter,
    currentPage,
    pageSize,
    enabled: canQuery,
  })

  const tabs = useMemo(
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

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const offset = (currentPage - 1) * pageSize
  const startItem = totalItems === 0 ? 0 : offset + 1
  const endItem =
    totalItems === 0 ? 0 : Math.min(offset + rows.length, totalItems)

  return (
    <section className="dashboard-card flex min-h-0 flex-col">
      <div className="dashboard-card-head">
        <div>
          <h2 className="dashboard-section-title text-sm">
            {walletCurrency} wallet activity
          </h2>
          <p className="dashboard-caption">
            Recent transactions for {walletLabel}
          </p>
        </div>
        <Link to="/dashboard/transactions" className="dashboard-link-sm">
          View all
        </Link>
      </div>

      <TransactionStatusTabs
        tabs={tabs}
        activeId={statusFilter}
        onChange={setStatusFilter}
        ariaLabel="Filter wallet transactions by status"
      />

      <div
        key={`${walletCurrency}-${statusFilter}`}
        className="dashboard-transactions-table-panel dashboard-wallet-activity-table-panel dashboard-activity-table-panel dashboard-table-wrap min-w-0"
      >
        <DashboardTransactionsTable
          transactionsQuery={transactionsQuery}
          rows={rows}
          emptyMessage={
            canQuery
              ? emptyMessageForFilter(statusFilter, walletCurrency, walletLabel)
              : `Unable to load transactions for this wallet.`
          }
          minLoadingHeight="min-h-[240px]"
        />
      </div>

      {canQuery ? (
        <TransactionsFooter
          startItem={startItem}
          endItem={endItem}
          totalItems={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          isPending={transactionsQuery.isPending || statusCountsQuery.isPending}
          isFetching={transactionsQuery.isFetching}
          isLiveEnvironment={portalEnvironment === 'live'}
          onPageSizeChange={(value) => {
            setPageSize(value)
            setCurrentPage(1)
          }}
          onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNextPage={() => setCurrentPage((page) => page + 1)}
        />
      ) : null}
    </section>
  )
}
