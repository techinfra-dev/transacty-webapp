import type { UseQueryResult } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog, DIALOG_EXIT_ANIMATION_MS } from '../../../../components/ui/Dialog.tsx'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { usePortalRole } from '../../../../hooks/usePortalRole.ts'
import { useTransferRefundActions } from '../../hooks/useTransferRefundActions.ts'
import type {
  TransactionDetail,
  TransactionStatus,
} from '../../services/transactionsSchemas.ts'
import { RefundTransactionDialog } from './RefundTransactionDialog.tsx'
import { TransactionMethodTag } from './TransactionMethodTag.tsx'
import {
  getTransactionAmountDisplay,
  getTransactionFeeColumnDisplay,
  getTransactionHeaderAmountDisplay,
  formatTransactionFeeStatusLabel,
} from './transactionAmountUtils.ts'
import {
  formatTransactionDateParts,
  formatTransactionMoney,
  getLedgerStatusPillClass,
  getTransactionCurrency,
  isIndiaDisputeTransaction,
  toTitleCase,
} from './transactionFormatters.ts'

function StatusPill({ status }: { status: TransactionStatus }) {
  return (
    <span className={getLedgerStatusPillClass(status)}>
      <i aria-hidden />
      {toTitleCase(status)}
    </span>
  )
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function TxDetailRow({
  label,
  children,
  mono = false,
  dim = false,
  strong = false,
  copyable,
  copied,
  onCopy,
}: {
  label: string
  children: ReactNode
  mono?: boolean
  dim?: boolean
  strong?: boolean
  copyable?: boolean
  copied?: boolean
  onCopy?: () => void
}) {
  return (
    <div className="tx-detail-row">
      <div className="tx-detail-row-l">{label}</div>
      <div
        className={[
          'tx-detail-row-r',
          mono ? 'mono' : '',
          dim ? 'dim' : '',
          strong ? 'strong' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="tx-detail-row-val">{children}</span>
        {copyable && onCopy ? (
          <button
            type="button"
            className="tx-detail-copy"
            aria-label={copied ? 'Copied' : `Copy ${label}`}
            onClick={onCopy}
          >
            {copied ? (
              <span className="[font-family:var(--font-body)] text-[11px] font-semibold uppercase">
                OK
              </span>
            ) : (
              <CopyIcon />
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function getBalanceImpactDisplay(detail: TransactionDetail) {
  const currency = getTransactionCurrency(detail)

  if (detail.type === 'payout' && detail.totalWalletDebit) {
    return {
      label: 'Total wallet debit',
      value: detail.totalWalletDebit,
      currency,
    }
  }

  if (detail.type === 'transfer') {
    return {
      label: 'Total wallet debit',
      value: detail.totalWalletDebit?.trim() || detail.amount,
      currency,
    }
  }

  if (detail.netAmount != null && detail.netAmount.trim().length > 0) {
    return {
      label: 'Net to balance',
      value: detail.netAmount,
      currency,
    }
  }

  if (detail.status === 'failed') {
    return {
      label: 'Net to balance',
      value: '0',
      currency,
    }
  }

  const amounts = getTransactionAmountDisplay(detail)
  const paid = Number(amounts.settlementAmount)
  if (Number.isFinite(paid)) {
    return {
      label: 'Net to balance',
      value: String(paid),
      currency: amounts.settlementCurrency,
    }
  }

  return {
    label: 'Net to balance',
    value: detail.amount,
    currency,
  }
}

function TransactionTimeline({ detail }: { detail: TransactionDetail }) {
  const apiTimeline = detail.statusTimeline
  if (apiTimeline && apiTimeline.length > 0) {
    return (
      <ol className="tx-detail-timeline">
        {apiTimeline.map((step, index) => {
          const at = step.at || step.createdAt
          const parts = at
            ? formatTransactionDateParts(at, { includeSeconds: true })
            : null
          const isLast = index === apiTimeline.length - 1
          const statusLower = step.status.toLowerCase()
          const stepClass =
            statusLower.includes('fail')
              ? 'tx-detail-tl-fail'
              : statusLower.includes('pend')
                ? 'tx-detail-tl-pend'
                : 'tx-detail-tl-done'
          return (
            <li
              key={`${step.status}-${at ?? index}`}
              className={`tx-detail-tl-step ${stepClass}${isLast ? ' tx-detail-tl-final' : ''}`}
            >
              <i aria-hidden />
              <div>
                <div className="tx-detail-tl-label">{toTitleCase(step.status)}</div>
                <div className="tx-detail-tl-time">
                  {parts ? `${parts.date} · ${parts.time}` : step.note || '—'}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  const created = formatTransactionDateParts(detail.createdAt, {
    includeSeconds: true,
  })
  const completed = detail.completedAt
    ? formatTransactionDateParts(detail.completedAt, { includeSeconds: true })
    : null

  return (
    <ol className="tx-detail-timeline">
      <li className="tx-detail-tl-step tx-detail-tl-done">
        <i aria-hidden />
        <div>
          <div className="tx-detail-tl-label">Initiated</div>
          <div className="tx-detail-tl-time">
            {created.date} · {created.time}
          </div>
        </div>
      </li>
      {detail.status === 'success' ? (
        <li className="tx-detail-tl-step tx-detail-tl-done tx-detail-tl-final">
          <i aria-hidden />
          <div>
            <div className="tx-detail-tl-label">Settled</div>
            <div className="tx-detail-tl-time">
              {completed
                ? `${completed.date} · ${completed.time}`
                : `${created.date} · ${created.time}`}
            </div>
          </div>
        </li>
      ) : null}
      {detail.status === 'pending' ? (
        <li className="tx-detail-tl-step tx-detail-tl-pend tx-detail-tl-final">
          <i aria-hidden />
          <div>
            <div className="tx-detail-tl-label">Awaiting settlement</div>
            <div className="tx-detail-tl-time">Processing</div>
          </div>
        </li>
      ) : null}
      {detail.status === 'failed' ? (
        <li className="tx-detail-tl-step tx-detail-tl-fail tx-detail-tl-final">
          <i aria-hidden />
          <div>
            <div className="tx-detail-tl-label">Failed</div>
            <div className="tx-detail-tl-time">
              {completed
                ? `${completed.date} · ${completed.time}`
                : `${created.date} · ${created.time}`}
            </div>
          </div>
        </li>
      ) : null}
    </ol>
  )
}

function canRefundTransaction(detail: TransactionDetail, canWriteMoney: boolean) {
  if (!canWriteMoney || detail.status !== 'success') {
    return false
  }
  if (!detail.customerWalletId?.trim()) {
    return false
  }
  // Refunds apply to money that landed on a customer wallet (payin or transfer in).
  return detail.type === 'payin' || detail.type === 'transfer'
}

function TransactionDetailBody({
  detail,
  onClose,
  onRefund,
  canRefund,
}: {
  detail: TransactionDetail
  onClose: () => void
  onRefund?: () => void
  canRefund?: boolean
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const amounts = getTransactionAmountDisplay(detail)
  const headerAmount = getTransactionHeaderAmountDisplay(detail)
  const feeColumn = getTransactionFeeColumnDisplay(detail)
  const balanceImpact = getBalanceImpactDisplay(detail)
  const created = formatTransactionDateParts(detail.createdAt)

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1400)
    } catch {
      // Clipboard may be unavailable.
    }
  }

  return (
    <>
      <header className="tx-detail-head">
        <div className="tx-detail-eyebrow">Transaction</div>
        <h2 className="tx-detail-title">
          <FormattedMoney
            currency={headerAmount.currency}
            value={headerAmount.value}
          />
        </h2>
        <div className="tx-detail-meta">
          <StatusPill status={detail.status} />
          {isIndiaDisputeTransaction(detail) ? (
            <>
              <span className="tx-detail-meta-sep" aria-hidden />
              <span className="tx-detail-dispute-badge" role="status">
                Dispute
              </span>
            </>
          ) : null}
          <span className="tx-detail-meta-sep" aria-hidden />
          <TransactionMethodTag transaction={detail} />
          <span className="tx-detail-meta-sep" aria-hidden />
          <span>
            {created.date} · {created.time}
          </span>
        </div>
        <button
          type="button"
          className="tx-detail-close"
          aria-label="Close"
          onClick={onClose}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className="tx-detail-body">
        <div className="tx-detail-sect">Summary</div>
        <div className="tx-detail-dlist">
          <TxDetailRow label="Type">
            <TransactionMethodTag transaction={detail} />
          </TxDetailRow>
          <TxDetailRow label="Amount" mono>
            {amounts.isDualCurrency && amounts.localAmount && amounts.localCurrency ? (
              <FormattedMoney
                currency={amounts.localCurrency}
                value={amounts.localAmount}
              />
            ) : (
              <FormattedMoney
                currency={amounts.settlementCurrency}
                value={detail.amount}
              />
            )}
          </TxDetailRow>
          <TxDetailRow label="Settled amount" mono dim>
            {detail.status === 'pending' ? (
              '—'
            ) : (
              <FormattedMoney
                currency={amounts.settlementCurrency}
                value={amounts.settlementAmount}
              />
            )}
          </TxDetailRow>
          <TxDetailRow label="Platform fee" mono dim>
            {feeColumn.hasFee && feeColumn.value ? (
              formatTransactionMoney(feeColumn.value, feeColumn.currency)
            ) : (
              '—'
            )}
          </TxDetailRow>
          {detail.fees?.feeStatus ? (
            <TxDetailRow label="Fee status" dim>
              {formatTransactionFeeStatusLabel(detail.fees.feeStatus)}
            </TxDetailRow>
          ) : null}
          <TxDetailRow label={balanceImpact.label} mono strong>
            <FormattedMoney
              currency={balanceImpact.currency}
              value={balanceImpact.value}
            />
          </TxDetailRow>
          {amounts.conversionRate != null ? (
            <TxDetailRow label="Conversion rate" mono dim>
              {amounts.conversionRate.toLocaleString('en-US')}
            </TxDetailRow>
          ) : null}
          <TxDetailRow label="Status">
            <StatusPill status={detail.status} />
          </TxDetailRow>
          {detail.settlementCurrency ? (
            <TxDetailRow label="Settlement currency" dim>
              {detail.settlementCurrency}
            </TxDetailRow>
          ) : null}
        </div>

        <div className="tx-detail-sect">Customer</div>
        <div className="tx-detail-dlist">
          {amounts.payerName ? (
            <TxDetailRow label="Payer name">{amounts.payerName}</TxDetailRow>
          ) : null}
          {amounts.payerEmail ? (
            <TxDetailRow label="Payer email" mono>
              {amounts.payerEmail}
            </TxDetailRow>
          ) : null}
          <TxDetailRow label="Customer wallet" mono dim>
            {detail.customerWalletId || '—'}
          </TxDetailRow>
        </div>

        <div className="tx-detail-sect">References</div>
        <div className="tx-detail-dlist">
          <TxDetailRow
            label="Platform order"
            mono
            copyable={Boolean(detail.platformOrderId)}
            copied={copiedKey === 'po'}
            onCopy={
              detail.platformOrderId
                ? () => copy('po', detail.platformOrderId as string)
                : undefined
            }
          >
            {detail.platformOrderId || '—'}
          </TxDetailRow>
          <TxDetailRow
            label="Transaction ID"
            mono
            copyable
            copied={copiedKey === 'id'}
            onCopy={() => copy('id', detail.id)}
          >
            {detail.id}
          </TxDetailRow>
          <TxDetailRow label="Refund of" dim mono>
            {detail.refundOfTransactionId || '—'}
          </TxDetailRow>
        </div>

        <div className="tx-detail-sect">Timeline</div>
        <TransactionTimeline detail={detail} />
      </div>

      <footer className="tx-detail-foot">
        <button
          type="button"
          className="tx-detail-ghost-btn"
          onClick={() => copy('idfoot', detail.id)}
        >
          <CopyIcon />
          {copiedKey === 'idfoot' ? 'Copied' : 'Copy ID'}
        </button>
        <div className="tx-detail-foot-spacer" />
        {canRefund && onRefund ? (
          <button type="button" className="tx-detail-secondary-btn" onClick={onRefund}>
            Refund
          </button>
        ) : null}
        <button type="button" className="tx-detail-primary-btn" onClick={onClose}>
          Done
        </button>
      </footer>
    </>
  )
}

type ExitSnapshot =
  | { kind: 'detail'; detail: TransactionDetail }
  | { kind: 'error'; message: string }

type TransactionDetailDialogProps = {
  selectedTransactionId: string | null
  onClose: () => void
  detailQuery: UseQueryResult<TransactionDetail, Error>
}

export function TransactionDetailDialog({
  selectedTransactionId,
  onClose,
  detailQuery,
}: TransactionDetailDialogProps) {
  const { canWriteMoney } = usePortalRole()
  const moneyActions = useTransferRefundActions()
  const exitSnapshotRef = useRef<ExitSnapshot | null>(null)
  const [isRendered, setIsRendered] = useState(Boolean(selectedTransactionId))
  const [isVisible, setIsVisible] = useState(Boolean(selectedTransactionId))

  function startRefund(detail: TransactionDetail) {
    const walletId = detail.customerWalletId?.trim()
    if (!walletId) {
      return
    }
    moneyActions.openRefundForTransaction({
      customerWalletId: walletId,
      transactionId: detail.id,
      amount: detail.amount,
    })
  }

  const isRefundOverlayOpen =
    moneyActions.isRefundDialogOpen || moneyActions.liveMoneyConfirm === 'refund'

  useLayoutEffect(() => {
    if (!selectedTransactionId) {
      return
    }
    if (detailQuery.isPending && !detailQuery.data) {
      return
    }
    if (detailQuery.data?.id === selectedTransactionId) {
      exitSnapshotRef.current = { kind: 'detail', detail: detailQuery.data }
      return
    }
    if (detailQuery.isError) {
      exitSnapshotRef.current = {
        kind: 'error',
        message: detailQuery.error.message,
      }
    }
  }, [
    selectedTransactionId,
    detailQuery.isPending,
    detailQuery.data,
    detailQuery.isError,
    detailQuery.error,
  ])

  useEffect(() => {
    if (selectedTransactionId) {
      setIsRendered(true)
      window.requestAnimationFrame(() => setIsVisible(true))
      return
    }

    setIsVisible(false)
    const timeoutId = window.setTimeout(() => {
      setIsRendered(false)
      exitSnapshotRef.current = null
    }, DIALOG_EXIT_ANIMATION_MS + 50)

    return () => window.clearTimeout(timeoutId)
  }, [selectedTransactionId])

  useEffect(() => {
    if (!isRendered) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      // Let the stacked refund / live-confirm dialog handle Escape first.
      if (isRefundOverlayOpen) {
        return
      }
      onClose()
    }

    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [isRendered, onClose, isRefundOverlayOpen])

  if (!isRendered) {
    return null
  }

  let content: ReactNode = null

  if (selectedTransactionId) {
    if (detailQuery.isPending && !detailQuery.data) {
      content = (
        <div className="tx-detail-loading flex min-h-[200px] items-center justify-center">
          <LoadingSpinner label="Loading details..." />
        </div>
      )
    } else if (detailQuery.isError) {
      content = (
        <div className="tx-detail-error-wrap">
          <p className="tx-detail-error">{detailQuery.error.message}</p>
        </div>
      )
    } else if (detailQuery.data) {
      content = (
        <TransactionDetailBody
          detail={detailQuery.data}
          onClose={onClose}
          canRefund={canRefundTransaction(detailQuery.data, canWriteMoney)}
          onRefund={() => startRefund(detailQuery.data)}
        />
      )
    }
  } else {
    const snap = exitSnapshotRef.current
    if (snap?.kind === 'detail') {
      content = (
        <TransactionDetailBody
          detail={snap.detail}
          onClose={onClose}
          canRefund={canRefundTransaction(snap.detail, canWriteMoney)}
          onRefund={() => startRefund(snap.detail)}
        />
      )
    } else if (snap?.kind === 'error') {
      content = (
        <div className="tx-detail-error-wrap">
          <p className="tx-detail-error">{snap.message}</p>
        </div>
      )
    }
  }

  return (
    <>
      {createPortal(
        <div
          className={`tx-detail-scrim ${isVisible ? '' : 'tx-detail-scrim-closed'}`}
          onClick={() => {
            if (!isRefundOverlayOpen) {
              onClose()
            }
          }}
          role="presentation"
        >
          <div
            className={`tx-detail-modal ${isVisible ? '' : 'tx-detail-modal-closed'}`}
            role="dialog"
            aria-modal="true"
            aria-label="Transaction details"
            onClick={(event) => event.stopPropagation()}
          >
            {content}
          </div>
        </div>,
        document.body,
      )}

      <RefundTransactionDialog
        isOpen={moneyActions.isRefundDialogOpen}
        onClose={() => moneyActions.setIsRefundDialogOpen(false)}
        customerWalletId={moneyActions.refundCustomerWalletId}
        amount={moneyActions.refundAmount}
        onAmountChange={moneyActions.setRefundAmount}
        refundOfTransactionId={moneyActions.refundOfTransactionId}
        onRefundOfTransactionIdChange={moneyActions.setRefundOfTransactionId}
        reason={moneyActions.refundReason}
        onReasonChange={moneyActions.setRefundReason}
        lockTransactionId={moneyActions.refundTransactionLocked}
        stacked
        mutation={moneyActions.createRefundMutation}
        onSubmit={moneyActions.handleRefundSubmit}
      />

      <Dialog
        isOpen={moneyActions.liveMoneyConfirm === 'refund'}
        onClose={() => {
          if (!moneyActions.createRefundMutation.isPending) {
            moneyActions.setLiveMoneyConfirm(null)
          }
        }}
        title="Confirm live refund"
        description="This refund will be processed in the live environment and may affect real customer balances."
        maxWidthClassName="max-w-md"
        rootClassName="z-[140]"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full px-3 text-xs"
              disabled={moneyActions.createRefundMutation.isPending}
              onClick={() => moneyActions.setLiveMoneyConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 w-full px-3 text-xs"
              disabled={moneyActions.createRefundMutation.isPending}
              onClick={() => void moneyActions.executeRefund()}
            >
              {moneyActions.createRefundMutation.isPending
                ? 'Refunding...'
                : 'Confirm refund'}
            </Button>
          </div>
        }
      />
    </>
  )
}
