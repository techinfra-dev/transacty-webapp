import { Link } from '@tanstack/react-router'
import { Button } from '../../../../components/ui/Button.tsx'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import {
  getPayoutQueuedApprovalId,
  type PayoutQueuedApproval,
} from '../../services/payoutCreateResult.ts'

type PayoutQueuedApprovalViewProps = {
  approval: PayoutQueuedApproval
  formattedPreviewAmount: string
  environment: PortalEnvironment
  onCreateAnother: () => void
}

function formatExpiry(expiresAt: string | null | undefined) {
  if (!expiresAt?.trim()) {
    return null
  }
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) {
    return expiresAt
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PayoutQueuedApprovalView({
  approval,
  formattedPreviewAmount,
  environment,
  onCreateAnother,
}: PayoutQueuedApprovalViewProps) {
  const approvalId = getPayoutQueuedApprovalId(approval)
  const expiresLabel = formatExpiry(approval.expiresAt)

  return (
    <section className="payout-success">
      <span className="payout-success-badge payout-success-badge--pending">
        Submitted · waiting on approval
      </span>
      <h2 className="payout-success-title">Payout submitted, waiting on approval</h2>
      <p className="payout-success-desc">
        This payout needs a second approval before funds move. It is in the
        queue — not failed.
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Amount</p>
          <p className="payout-summary-value">{formattedPreviewAmount}</p>
        </div>
        <div>
          <p className="payout-summary-label">Status</p>
          <p className="payout-summary-value capitalize">
            {approval.status?.trim() || 'pending'}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Environment</p>
          <p className="payout-summary-value uppercase">{environment}</p>
        </div>
        {approvalId ? (
          <div>
            <p className="payout-summary-label">Request ID</p>
            <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
              {approvalId}
            </p>
          </div>
        ) : null}
        {expiresLabel ? (
          <div>
            <p className="payout-summary-label">Expires</p>
            <p className="payout-summary-value">{expiresLabel}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {approvalId ? (
          <Link
            to="/dashboard/payout-approvals/$approvalId"
            params={{ approvalId }}
            className="payout-btn-primary inline-flex h-11 items-center rounded-lg px-4"
          >
            Open pending approval
          </Link>
        ) : (
          <Link
            to="/dashboard/payout-approvals"
            className="payout-btn-primary inline-flex h-11 items-center rounded-lg px-4"
          >
            View pending approvals
          </Link>
        )}
        <Button type="button" variant="ghost" className="dash-btn-outline" onClick={onCreateAnother}>
          Create another payout
        </Button>
      </div>
    </section>
  )
}
