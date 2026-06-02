import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { usePortalEnvironmentStore } from '../../../../store/portalEnvironmentStore.ts'
import { useTransactionsListQuery } from '../../hooks/useTransactionsQueries.ts'
import type { TransactionRailApi } from '../../services/transactionsSchemas.ts'
import { getTransactionCurrency } from '../transactions/transactionFormatters.ts'
import { TransactionsFooter } from '../transactions/TransactionsFooter.tsx'
import { DashboardTransactionsTable } from '../DashboardTransactionsTable.tsx'

type WalletActivityTableProps = {
  currency: string
  walletLabel: string
  walletRail: TransactionRailApi | undefined
}

export function WalletActivityTable({
  currency,
  walletLabel,
  walletRail,
}: WalletActivityTableProps) {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const hasRailFilter = Boolean(walletRail)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const offset = (currentPage - 1) * pageSize

  useEffect(() => {
    setCurrentPage(1)
  }, [walletRail, currency])

  const transactionsQuery = useTransactionsListQuery(
    {
      rail: walletRail,
      limit: pageSize,
      offset,
    },
    { enabled: hasRailFilter },
  )

  const rows = useMemo(() => {
    const items = transactionsQuery.data?.items ?? []
    if (hasRailFilter) {
      return items
    }
    const code = currency.trim().toUpperCase()
    return items.filter(
      (item) => getTransactionCurrency(item).toUpperCase() === code,
    )
  }, [currency, hasRailFilter, transactionsQuery.data?.items])

  const totalItems = hasRailFilter
    ? (transactionsQuery.data?.total ?? 0)
    : rows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : offset + 1
  const pageRowCount = transactionsQuery.data?.items.length ?? rows.length
  const endItem =
    totalItems === 0 ? 0 : Math.min(offset + pageRowCount, totalItems)

  return (
    <section className="dashboard-card flex min-h-0 flex-col">
      <div className="dashboard-card-head">
        <div>
          <h2 className="dashboard-section-title text-sm">
            {currency} wallet activity
          </h2>
          <p className="dashboard-caption">
            Recent transactions for {walletLabel}
          </p>
        </div>
        <Link to="/dashboard/transactions" className="dashboard-link-sm">
          View all
        </Link>
      </div>

      <div className="dashboard-transactions-table-panel dashboard-wallet-activity-table-panel dashboard-table-wrap min-w-0">
        <DashboardTransactionsTable
          transactionsQuery={transactionsQuery}
          rows={rows}
          emptyMessage={
            hasRailFilter
              ? `No transactions found for ${walletLabel}.`
              : `Unable to load transactions for this wallet region.`
          }
          minLoadingHeight="min-h-[240px]"
        />
      </div>

      {hasRailFilter ? (
        <TransactionsFooter
          startItem={startItem}
          endItem={endItem}
          totalItems={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          isPending={transactionsQuery.isPending}
          isFetching={transactionsQuery.isFetching}
          isLiveEnvironment={portalEnvironment === 'live'}
          onPageSizeChange={(value) => {
            setPageSize(value)
            setCurrentPage(1)
          }}
          onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNextPage={() =>
            setCurrentPage((page) => page + 1)
          }
        />
      ) : null}
    </section>
  )
}
