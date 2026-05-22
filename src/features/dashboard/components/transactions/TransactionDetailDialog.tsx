import type { UseQueryResult } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog, DIALOG_EXIT_ANIMATION_MS } from '../../../../components/ui/Dialog.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { TransactionDetail } from '../../services/transactionsSchemas.ts'
import {
  formatTransactionDate,
  formatTransactionMoney,
  getStatusClassName,
  toTitleCase,
} from './transactionFormatters.ts'
import { TransactionDetailRow } from './TransactionDetailRow.tsx'

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center justify-center rounded-md border border-[#D4CFC4] bg-white p-1.5 text-[#566167] transition hover:border-[#9D8F82] hover:bg-[#F3E8D6] hover:text-[#0F0700]"
      aria-label={copied ? 'Copied' : 'Copy transaction ID'}
      title="Copy ID"
    >
      {copied ? (
        <span className="px-1 [font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Copied
        </span>
      ) : (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
          <path
            fill="currentColor"
            d="M6 4.75A1.75 1.75 0 0 1 7.75 3h6.5A1.75 1.75 0 0 1 16 4.75v8.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25v-8.5Zm-2 2A1.75 1.75 0 0 0 2.25 8.5v7A1.75 1.75 0 0 0 4 17.25h6a.75.75 0 0 0 0-1.5H4a.25.25 0 0 1-.25-.25v-7A.25.25 0 0 1 4 8.25h.75a.75.75 0 0 0 0-1.5H4Z"
          />
        </svg>
      )}
    </button>
  )
}

function TransactionDetailError({ message }: { message: string }) {
  return (
    <div className="px-5 py-6">
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 [font-family:var(--font-body)] text-sm text-rose-800">
        {message}
      </p>
    </div>
  )
}

function TransactionDetailBody({ detail }: { detail: TransactionDetail }) {
  return (
    <div className="px-5 pb-2 pt-5">
      <div className="overflow-hidden rounded-xl border border-[#E8E4DE] bg-[#FCFAF7] px-1 sm:px-2">
        <div className="bg-white">
          <TransactionDetailRow label="Type">
            <span className="font-semibold">{toTitleCase(detail.type)}</span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Status">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusClassName(
                detail.status,
              )}`}
            >
              {toTitleCase(detail.status)}
            </span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Amount">
            <span className="tabular-nums font-semibold tracking-tight">
              {formatTransactionMoney(detail.amount)}
            </span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Paid">
            <span className="tabular-nums font-semibold tracking-tight">
              {formatTransactionMoney(detail.paidAmount || detail.amount)}
            </span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Customer wallet">
            <span className="break-all font-medium text-[#464644]">
              {detail.customerWalletId || '—'}
            </span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Platform order">
            <span className="break-all font-medium text-[#464644]">
              {detail.platformOrderId || '—'}
            </span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Created">
            <span className="text-[#464644]">{formatTransactionDate(detail.createdAt)}</span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Completed">
            <span className="text-[#464644]">
              {detail.completedAt ? formatTransactionDate(detail.completedAt) : '—'}
            </span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Refund of transaction">
            <span className="break-all font-mono text-[12px] font-medium text-[#464644]">
              {detail.refundOfTransactionId || '—'}
            </span>
          </TransactionDetailRow>
          <TransactionDetailRow label="Transaction ID">
            <div className="flex flex-wrap items-start justify-end gap-2 sm:items-center">
              <span className="break-all text-right font-mono text-[12px] font-medium leading-relaxed tracking-tight text-[#0F0700]">
                {detail.id}
              </span>
              <CopyIdButton id={detail.id} />
            </div>
          </TransactionDetailRow>
        </div>
      </div>
    </div>
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
    if (selectedTransactionId != null) {
      return
    }
    const t = window.setTimeout(() => {
      exitSnapshotRef.current = null
    }, DIALOG_EXIT_ANIMATION_MS + 50)
    return () => window.clearTimeout(t)
  }, [selectedTransactionId])

  let body: ReactNode = null
  if (selectedTransactionId) {
    if (detailQuery.isPending && !detailQuery.data) {
      body = (
        <div className="flex min-h-[160px] items-center justify-center px-5 py-8">
          <LoadingSpinner label="Loading details..." />
        </div>
      )
    } else if (detailQuery.isError) {
      body = <TransactionDetailError message={detailQuery.error.message} />
    } else if (detailQuery.data) {
      body = <TransactionDetailBody detail={detailQuery.data} />
    }
  } else {
    const snap = exitSnapshotRef.current
    if (snap?.kind === 'detail') {
      body = <TransactionDetailBody detail={snap.detail} />
    } else if (snap?.kind === 'error') {
      body = <TransactionDetailError message={snap.message} />
    }
  }

  return (
    <Dialog
      isOpen={Boolean(selectedTransactionId)}
      onClose={onClose}
      title="Transaction details"
      bodyVariant="plain"
      maxWidthClassName="max-w-xl"
      contentClassName="!px-0 !py-0"
      footer={
        <Button
          type="button"
          className="h-10! w-full rounded-lg px-4"
          onClick={onClose}
        >
          Close
        </Button>
      }
    >
      {body}
    </Dialog>
  )
}
