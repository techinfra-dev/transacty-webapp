import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import type { TransactionsListResponse } from '../../services/transactionsSchemas.ts'
import { getTransactionCurrency } from '../transactions/transactionFormatters.ts'
import { DashboardTransactionsTable } from '../DashboardTransactionsTable.tsx'

type WalletActivityTableProps = {
  currency: string
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
}

export function WalletActivityTable({
  currency,
  transactionsQuery,
}: WalletActivityTableProps) {
  const rows = useMemo(() => {
    const items = transactionsQuery.data?.items ?? []
    return items.filter(
      (item) => getTransactionCurrency(item).toUpperCase() === currency.toUpperCase(),
    )
  }, [currency, transactionsQuery.data?.items])

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-head">
        <div>
          <h2 className="dashboard-section-title text-sm">
            {currency} wallet activity
          </h2>
          <p className="dashboard-caption">
            Recent transactions for this merchant pocket
          </p>
        </div>
        <Link to="/dashboard/transactions" className="dashboard-link-sm">
          View all
        </Link>
      </div>

      <div className="dashboard-table-wrap dashboard-table-scroll min-w-0">
        <DashboardTransactionsTable
          transactionsQuery={transactionsQuery}
          rows={rows}
          emptyMessage={`No recent ${currency} transactions found.`}
          minLoadingHeight="min-h-[240px]"
        />
      </div>
    </section>
  )
}
