import { Link } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { formatDateTime } from '../customers/customerViewUtils.tsx'
import {
  getPayoutApprovalId,
  normalizePayoutApprovalStatus,
  type PayoutApprovalItem,
  type PayoutApprovalStatus,
} from '../../services/payoutApprovalsSchemas.ts'

function statusPillClass(status: string) {
  if (status === 'approved') return 'dashboard-pill dashboard-pill-succ'
  if (status === 'pending') return 'dashboard-pill dashboard-pill-pend'
  return 'dashboard-pill dashboard-pill-fail'
}

function formatAmount(item: PayoutApprovalItem) {
  const amount = item.amount == null ? '' : String(item.amount)
  const currency = item.currency?.trim().toUpperCase() ?? ''
  if (!amount && !currency) return '—'
  return `${currency} ${amount}`.trim()
}

type PayoutApprovalsTableProps = {
  items: PayoutApprovalItem[]
  isPending: boolean
  isError: boolean
  errorMessage?: string
  statusFilter?: PayoutApprovalStatus
}

export function PayoutApprovalsTable({
  items,
  isPending,
  isError,
  errorMessage,
  statusFilter,
}: PayoutApprovalsTableProps) {
  if (isPending) {
    return (
      <div className="flex min-h-50 items-center justify-center">
        <LoadingSpinner label="Loading approvals…" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="payout-alert payout-alert--inline">
        {errorMessage || 'Unable to load payout approvals.'}
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center [font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
        No payout approvals in this view.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="payout-approvals-table w-full min-w-160 border-collapse text-left">
        <thead>
          <tr className="border-b border-(--dash-hairline) [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-[0.08em] text-(--dash-fg-subtle)">
            <th className="px-4 py-2.5">Request</th>
            <th className="px-4 py-2.5">Amount</th>
            <th className="px-4 py-2.5">Rail</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Requested by</th>
            <th className="px-4 py-2.5">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const approvalId = getPayoutApprovalId(item)
            const status = normalizePayoutApprovalStatus(item.status)
            const submitted = item.createdAt
              ? formatDateTime(item.createdAt)
              : null
            const shortId = approvalId
              ? approvalId.length > 16
                ? `${approvalId.slice(0, 8)}…${approvalId.slice(-4)}`
                : approvalId
              : '—'
            return (
              <tr
                key={approvalId || `row-${index}`}
                className="border-b border-(--dash-hairline) last:border-b-0"
              >
                <td className="px-4 py-3">
                  {approvalId ? (
                    <Link
                      to="/dashboard/payout-approvals/$approvalId"
                      params={{ approvalId }}
                      search={statusFilter ? { status: statusFilter } : {}}
                      className="[font-family:var(--font-body)] text-sm font-semibold text-(--dash-fg) underline-offset-2 hover:underline"
                    >
                      {shortId}
                    </Link>
                  ) : (
                    <span className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
                      —
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 [font-family:var(--font-body)] text-sm">
                  {formatAmount(item)}
                </td>
                <td className="px-4 py-3 [font-family:var(--font-body)] text-sm uppercase">
                  {item.rail?.trim() || item.market?.trim() || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={statusPillClass(status)}>
                    {status}
                  </span>
                </td>
                <td className="px-4 py-3 font-[ui-monospace,monospace] text-xs text-(--dash-fg-muted)">
                  {item.requestedBy?.trim() || '—'}
                </td>
                <td className="px-4 py-3 [font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
                  {submitted
                    ? `${submitted.primary} · ${submitted.secondary}`
                    : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const PAYOUT_APPROVAL_STATUS_FILTERS: Array<{
  id: 'all' | PayoutApprovalStatus
  label: string
}> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'expired', label: 'Expired' },
]
