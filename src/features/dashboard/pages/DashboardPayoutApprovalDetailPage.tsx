import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import { formatDateTime } from '../components/customers/customerViewUtils.tsx'
import {
  useApprovePayoutApprovalMutation,
  usePayoutApprovalDetailQuery,
  useRejectPayoutApprovalMutation,
} from '../hooks/usePayoutApprovalQueries.ts'
import {
  getPayoutApprovalId,
  normalizePayoutApprovalStatus,
} from '../services/payoutApprovalsSchemas.ts'

function statusPillClass(status: string) {
  if (status === 'approved') return 'dashboard-pill dashboard-pill-succ'
  if (status === 'pending') return 'dashboard-pill dashboard-pill-pend'
  return 'dashboard-pill dashboard-pill-fail'
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="payout-summary-label">{label}</p>
      <div className="payout-summary-value">{children}</div>
    </div>
  )
}

export function DashboardPayoutApprovalDetailPage() {
  const { approvalId } = useParams({
    from: '/dashboard/payout-approvals/$approvalId',
  })
  const { status: statusFilter } = useSearch({
    from: '/dashboard/payout-approvals/$approvalId',
  })
  const navigate = useNavigate()
  const { canWriteMoney } = usePortalRole()
  const detailQuery = usePayoutApprovalDetailQuery(approvalId)
  const approveMutation = useApprovePayoutApprovalMutation()
  const rejectMutation = useRejectPayoutApprovalMutation()
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const item = detailQuery.data
  const status = normalizePayoutApprovalStatus(item?.status)
  const isPending = status === 'pending'
  const submitted = item?.createdAt ? formatDateTime(item.createdAt) : null
  const expires = item?.expiresAt ? formatDateTime(item.expiresAt) : null
  const amount =
    item?.amount == null
      ? '—'
      : `${item.currency?.trim().toUpperCase() ?? ''} ${String(item.amount)}`.trim()

  if (!canWriteMoney) {
    return (
      <section className="app-page-enter">
        <header className="mb-1">
          <h1 className="dash-page-title">Payout approval</h1>
          <p className="dash-page-subtitle">
            Finance or admin role is required to review payout approvals.
          </p>
        </header>
      </section>
    )
  }

  async function handleApprove() {
    setActionError(null)
    try {
      await approveMutation.mutateAsync(approvalId)
      void navigate({
        to: '/dashboard/payout-approvals',
        search: statusFilter ? { status: statusFilter } : {},
      })
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to approve this payout.',
      )
    }
  }

  async function handleReject() {
    setActionError(null)
    try {
      await rejectMutation.mutateAsync({
        approvalId,
        reason: rejectReason,
      })
      setIsRejectOpen(false)
      setRejectReason('')
      void navigate({
        to: '/dashboard/payout-approvals',
        search: statusFilter ? { status: statusFilter } : {},
      })
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to reject this payout.',
      )
    }
  }

  return (
    <section className="app-page-enter flex flex-col gap-4">
      <header className="mb-1">
        <Link
          to="/dashboard/payout-approvals"
          search={statusFilter ? { status: statusFilter } : {}}
          className="[font-family:var(--font-body)] text-xs font-semibold text-(--dash-fg-muted) hover:text-(--dash-fg)"
        >
          ← Pending approvals
        </Link>
        <h1 className="dash-page-title mt-2">Payout approval</h1>
        <p className="dash-page-subtitle">
          Review a queued payout. Approving requires a fresh authenticator code
          and payout PIN. Rejecting requires a fresh authenticator code and a
          reason.
        </p>
      </header>

      {detailQuery.isPending ? (
        <div className="flex min-h-50 items-center justify-center">
          <LoadingSpinner label="Loading approval…" />
        </div>
      ) : detailQuery.isError || !item ? (
        <p className="payout-alert">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : 'Unable to load this payout approval.'}
        </p>
      ) : (
        <div className="dashboard-card p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={statusPillClass(status)}>{status}</span>
            <span className="[font-family:var(--font-body)] text-xs text-(--dash-fg-subtle)">
              {item.environment?.toString().toUpperCase() || '—'}
            </span>
          </div>

          <div className="payout-success-details">
            <DetailField label="Request ID">
              <span className="font-[ui-monospace,monospace] text-xs">
                {getPayoutApprovalId(item) || approvalId}
              </span>
            </DetailField>
            <DetailField label="Amount">{amount || '—'}</DetailField>
            <DetailField label="Rail">
              {item.rail?.trim() || item.market?.trim() || '—'}
            </DetailField>
            <DetailField label="Submitted">
              {submitted
                ? `${submitted.primary} · ${submitted.secondary}`
                : '—'}
            </DetailField>
            <DetailField label="Expires">
              {expires ? `${expires.primary} · ${expires.secondary}` : '—'}
            </DetailField>
            <DetailField label="Requested by">
              <span className="font-[ui-monospace,monospace] text-xs">
                {item.requestedBy?.trim() || '—'}
              </span>
            </DetailField>
            <DetailField label="Approved by">
              <span className="font-[ui-monospace,monospace] text-xs">
                {item.approvedBy?.trim() || '—'}
              </span>
            </DetailField>
            {item.reason?.trim() ? (
              <DetailField label="Reject reason">{item.reason.trim()}</DetailField>
            ) : null}
          </div>

          <p className="mt-4 [font-family:var(--font-body)] text-xs text-(--dash-fg-subtle)">
            Requested by / approved by are merchant-user IDs from the API. Emails
            are not included yet — we are not looking them up on the client.
          </p>

          {actionError ? (
            <p className="payout-alert mt-4">{actionError}</p>
          ) : null}

          {isPending && canWriteMoney ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className="px-4"
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => void handleApprove()}
              >
                {approveMutation.isPending ? 'Approving…' : 'Approve'}
              </Button>
              <Button
                variant="ghost"
                className="dash-btn-outline px-4"
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => setIsRejectOpen(true)}
              >
                Reject
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <Dialog
        isOpen={isRejectOpen}
        onClose={() => {
          if (rejectMutation.isPending) return
          setIsRejectOpen(false)
        }}
        title="Reject payout"
        description="This does not debit the wallet. Enter why this payout should not go through."
        maxWidthClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={rejectMutation.isPending}
              onClick={() => setIsRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={rejectMutation.isPending || rejectReason.trim().length === 0}
              onClick={() => void handleReject()}
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject payout'}
            </Button>
          </div>
        }
      >
        <label className="block">
          <span className="settings-hint">Reason</span>
          <Input
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="mt-1"
            placeholder="Duplicate request, wrong beneficiary, …"
            autoComplete="off"
          />
        </label>
      </Dialog>
    </section>
  )
}
