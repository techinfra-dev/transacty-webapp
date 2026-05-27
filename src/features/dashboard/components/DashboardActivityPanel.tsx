import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTransactionsListQuery } from '../hooks/useTransactionsQueries.ts'
import { DashboardTransactionsTable } from './DashboardTransactionsTable.tsx'
import {
  TransactionStatusTabs,
  type TransactionStatusTabId,
} from './transactions/TransactionStatusTabs.tsx'

const RECENT_ACTIVITY_LIMIT = 10

type ActivityStatusFilter = TransactionStatusTabId

function formatSyncedAgo(updatedAt: number) {
  const sec = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))
  if (sec < 10) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  return `${Math.floor(hr / 24)}d ago`
}

function emptyMessageForFilter(filter: ActivityStatusFilter) {
  if (filter === 'all') {
    return 'No recent transactions found.'
  }
  const label =
    filter === 'success'
      ? 'successful'
      : filter === 'pending'
        ? 'pending'
        : 'failed'
  return `No ${label} transactions in the last ${RECENT_ACTIVITY_LIMIT}.`
}

export function DashboardActivityPanel() {
  const [statusFilter, setStatusFilter] = useState<ActivityStatusFilter>('all')

  const transactionsQuery = useTransactionsListQuery({
    limit: RECENT_ACTIVITY_LIMIT,
    offset: 0,
  })
  const rows = transactionsQuery.data?.items ?? []

  const counts = useMemo(() => {
    let success = 0
    let pending = 0
    let failed = 0
    for (const r of rows) {
      if (r.status === 'success') success += 1
      else if (r.status === 'pending') pending += 1
      else failed += 1
    }
    return {
      all: rows.length,
      success,
      pending,
      failed,
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows
    return rows.filter((r) => r.status === statusFilter)
  }, [rows, statusFilter])

  const syncedLabel = transactionsQuery.dataUpdatedAt
    ? formatSyncedAgo(transactionsQuery.dataUpdatedAt)
    : '…'

  const tabs: { id: ActivityStatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'success', label: 'Successful', count: counts.success },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'failed', label: 'Failed', count: counts.failed },
  ]

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-head">
        <div className="min-w-0">
          <h2 className="dashboard-section-title text-sm">Recent activity</h2>
          <p className="dashboard-caption">
            Last {RECENT_ACTIVITY_LIMIT} transactions · synced {syncedLabel}.{' '}
            <Link to="/dashboard/transactions" className="dashboard-caption-link">
              View all
            </Link>{' '}
            for full history.
          </p>
        </div>
        <Link to="/dashboard/transactions" className="dashboard-link-sm shrink-0 whitespace-nowrap">
          View all →
        </Link>
      </div>

      <TransactionStatusTabs
        tabs={tabs}
        activeId={statusFilter}
        onChange={setStatusFilter}
        ariaLabel="Filter recent transactions by status"
      />

      <div
        key={statusFilter}
        className="dashboard-activity-table-panel dashboard-table-wrap min-w-0"
      >
        <DashboardTransactionsTable
          transactionsQuery={transactionsQuery}
          rows={filteredRows}
          emptyMessage={emptyMessageForFilter(statusFilter)}
        />
      </div>
    </section>
  )
}
