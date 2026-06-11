import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { usePortalEnvironmentStore } from '../../../../store/portalEnvironmentStore.ts'
import { useTransactionsListQuery } from '../../hooks/useTransactionsQueries.ts'
import type { TransactionRailApi } from '../../services/transactionsSchemas.ts'
import { transactionMatchesCurrency } from '../transactions/transactionFormatters.ts'
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
  const walletCurrency = currency.trim().toUpperCase()
  const canQuery = Boolean(walletRail && walletCurrency)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const offset = (currentPage - 1) * pageSize

  useEffect(() => {
    setCurrentPage(1)
  }, [walletRail, walletCurrency])

  const transactionsQuery = useTransactionsListQuery(
    {
      rail: walletRail,
      currency: walletCurrency,
      limit: pageSize,
      offset,
    },
    { enabled: canQuery },
  )

  const rows = useMemo(() => {
    const items = transactionsQuery.data?.items ?? []
    return items.filter((item) => transactionMatchesCurrency(item, walletCurrency))
  }, [transactionsQuery.data?.items, walletCurrency])

  const totalItems = transactionsQuery.data?.total ?? rows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : offset + 1
  const pageRowCount = rows.length
  const endItem =
    totalItems === 0 ? 0 : Math.min(offset + pageRowCount, totalItems)

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

      <div className="dashboard-transactions-table-panel dashboard-wallet-activity-table-panel dashboard-table-wrap min-w-0">
        <DashboardTransactionsTable
          transactionsQuery={transactionsQuery}
          rows={rows}
          emptyMessage={
            canQuery
              ? `No ${walletCurrency} transactions found for ${walletLabel}.`
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
