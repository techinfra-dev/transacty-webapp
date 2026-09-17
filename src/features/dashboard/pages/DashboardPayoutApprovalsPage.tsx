import { useNavigate, useSearch } from '@tanstack/react-router'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import {
  PAYOUT_APPROVAL_STATUS_FILTERS,
  PayoutApprovalsTable,
} from '../components/payout-approvals/PayoutApprovalsTable.tsx'
import { usePayoutApprovalsQuery } from '../hooks/usePayoutApprovalQueries.ts'

export function DashboardPayoutApprovalsPage() {
  const { canWriteMoney } = usePortalRole()
  const { status } = useSearch({ from: '/dashboard/payout-approvals' })
  const navigate = useNavigate()
  const listQuery = usePayoutApprovalsQuery(status)
  const activeStatus = status ?? 'all'

  if (!canWriteMoney) {
    return (
      <section className="app-page-enter">
        <header className="mb-1">
          <h1 className="dash-page-title">Pending approvals</h1>
          <p className="dash-page-subtitle">
            Finance or admin role is required to review payout approvals.
          </p>
        </header>
      </section>
    )
  }

  return (
    <section className="payout-approvals-page app-page-enter flex h-full min-h-0 flex-col gap-3">
      <header className="mb-1">
        <h1 className="dash-page-title">Pending approvals</h1>
        <p className="dash-page-subtitle">
          Large or velocity-reviewed payouts wait here for a second approval
          before funds move.
        </p>
      </header>

      <div
        className="dashboard-activity-tabstrip border border-(--dash-hairline) bg-(--dash-surface) px-3"
        role="tablist"
        aria-label="Filter payout approvals by status"
      >
        <div className="dashboard-activity-tabs">
          {PAYOUT_APPROVAL_STATUS_FILTERS.map((tab) => {
            const selected = activeStatus === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`dashboard-activity-tab ${
                  selected ? 'dashboard-activity-tab--active' : ''
                }`}
                onClick={() =>
                  void navigate({
                    to: '/dashboard/payout-approvals',
                    search: tab.id === 'all' ? {} : { status: tab.id },
                  })
                }
              >
                <span className="dashboard-activity-tab-label">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="dashboard-card min-h-0 flex-1 overflow-hidden">
        <PayoutApprovalsTable
          items={listQuery.data ?? []}
          isPending={listQuery.isPending}
          isError={listQuery.isError}
          errorMessage={
            listQuery.error instanceof Error
              ? listQuery.error.message
              : undefined
          }
          statusFilter={status}
        />
      </div>
    </section>
  )
}
