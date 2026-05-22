import { Link } from '@tanstack/react-router'
import { useTransactionsListQuery } from '../hooks/useTransactionsQueries.ts'
import { DashboardTransactionsTable } from './DashboardTransactionsTable.tsx'

export function DashboardActivityPanel() {
  const transactionsQuery = useTransactionsListQuery({
    limit: 7,
    offset: 0,
  })
  const rows = transactionsQuery.data?.items ?? []

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-head">
        <h2 className="dashboard-section-title text-sm">Recent transactions</h2>
        <Link to="/dashboard/transactions" className="dashboard-link-sm">
          View all
        </Link>
      </div>

      <div className="dashboard-table-wrap min-w-0">
        <DashboardTransactionsTable
          transactionsQuery={transactionsQuery}
          rows={rows}
          emptyMessage="No recent transactions found."
        />
      </div>
    </section>
  )
}
