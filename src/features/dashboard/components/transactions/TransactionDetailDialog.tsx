import type { UseQueryResult } from '@tanstack/react-query'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { TransactionDetail } from '../../services/transactionsSchemas.ts'
import {
  formatTransactionDate,
  formatTransactionMoney,
  toTitleCase,
} from './transactionFormatters.ts'

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
  return (
    <Dialog
      isOpen={Boolean(selectedTransactionId)}
      onClose={onClose}
      title="Transaction details"
      description={
        selectedTransactionId ? `Details for ${selectedTransactionId}` : 'Transaction details'
      }
      maxWidthClassName="max-w-xl"
    >
      {detailQuery.isPending ? (
        <div className="flex min-h-[140px] items-center justify-center">
          <LoadingSpinner label="Loading details..." />
        </div>
      ) : detailQuery.isError ? (
        <p className="[font-family:var(--font-body)] text-sm text-rose-600">
          {detailQuery.error.message}
        </p>
      ) : detailQuery.data ? (
        <div className="space-y-2 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
          <p>
            <span className="font-semibold text-(--color-secondary)">ID:</span>{' '}
            {detailQuery.data.id}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Type:</span>{' '}
            {toTitleCase(detailQuery.data.type)}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Status:</span>{' '}
            {toTitleCase(detailQuery.data.status)}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Amount:</span>{' '}
            {formatTransactionMoney(detailQuery.data.amount)}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Paid:</span>{' '}
            {formatTransactionMoney(detailQuery.data.paidAmount || detailQuery.data.amount)}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Customer wallet:</span>{' '}
            {detailQuery.data.customerWalletId || '-'}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Platform order:</span>{' '}
            {detailQuery.data.platformOrderId || '-'}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Created:</span>{' '}
            {formatTransactionDate(detailQuery.data.createdAt)}
          </p>
          <p>
            <span className="font-semibold text-(--color-secondary)">Completed:</span>{' '}
            {detailQuery.data.completedAt
              ? formatTransactionDate(detailQuery.data.completedAt)
              : '-'}
          </p>
        </div>
      ) : null}
    </Dialog>
  )
}
