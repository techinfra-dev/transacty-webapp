import type { UseQueryResult } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DIALOG_EXIT_ANIMATION_MS } from '../../../../components/ui/Dialog.tsx'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type {
  TransactionDetail,
  TransactionStatus,
} from '../../services/transactionsSchemas.ts'
import { TransactionMethodTag } from './TransactionMethodTag.tsx'
import {
  formatTransactionDateParts,
  getTransactionCurrency,
  getLedgerStatusPillClass,
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
              <span className="[font-family:var(--font-body)] text-[9px] font-semibold uppercase">
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

function computeNetAmount(detail: TransactionDetail) {
  if (detail.status === 'failed') {
    return 0
  }
  const paid = Number(detail.paidAmount ?? detail.amount)
  const amount = Number(detail.amount)
  if (Number.isFinite(paid)) {
    return paid
  }
  return Number.isFinite(amount) ? amount : 0
}

function TransactionTimeline({ detail }: { detail: TransactionDetail }) {
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

function TransactionDetailBody({
  detail,
  onClose,
}: {
  detail: TransactionDetail
  onClose: () => void
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const currency = getTransactionCurrency(detail)
  const created = formatTransactionDateParts(detail.createdAt)
  const net = computeNetAmount(detail)

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
          <FormattedMoney currency={currency} value={detail.amount} />
        </h2>
        <div className="tx-detail-meta">
          <StatusPill status={detail.status} />
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
            <FormattedMoney currency={currency} value={detail.amount} />
          </TxDetailRow>
          <TxDetailRow label="Paid amount" mono dim>
            <FormattedMoney
              currency={currency}
              value={detail.paidAmount || detail.amount}
            />
          </TxDetailRow>
          <TxDetailRow label="Net to balance" mono strong>
            <FormattedMoney currency={currency} value={String(net)} />
          </TxDetailRow>
          <TxDetailRow label="Status">
            <StatusPill status={detail.status} />
          </TxDetailRow>
        </div>

        <div className="tx-detail-sect">Customer</div>
        <div className="tx-detail-dlist">
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
  const exitSnapshotRef = useRef<ExitSnapshot | null>(null)
  const [isRendered, setIsRendered] = useState(Boolean(selectedTransactionId))
  const [isVisible, setIsVisible] = useState(Boolean(selectedTransactionId))

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
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [isRendered, onClose])

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
        <TransactionDetailBody detail={detailQuery.data} onClose={onClose} />
      )
    }
  } else {
    const snap = exitSnapshotRef.current
    if (snap?.kind === 'detail') {
      content = <TransactionDetailBody detail={snap.detail} onClose={onClose} />
    } else if (snap?.kind === 'error') {
      content = (
        <div className="tx-detail-error-wrap">
          <p className="tx-detail-error">{snap.message}</p>
        </div>
      )
    }
  }

  return createPortal(
    <div
      className={`tx-detail-scrim ${isVisible ? '' : 'tx-detail-scrim-closed'}`}
      onClick={onClose}
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
  )
}
