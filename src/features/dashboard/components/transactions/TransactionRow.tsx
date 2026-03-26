import { Button } from '../../../../components/ui/Button.tsx'
import type { TransactionItem } from '../../services/transactionsSchemas.ts'
import {
  formatTransactionDate,
  formatTransactionMoney,
  getStatusClassName,
  toTitleCase,
} from './transactionFormatters.ts'

type TransactionRowProps = {
  transaction: TransactionItem
  onView: () => void
}

export function TransactionRow({ transaction, onView }: TransactionRowProps) {
  return (
    <article className="grid gap-2 border-b border-(--color-accent)/25 bg-(--color-card) px-5 py-2 transition-colors duration-150 ease-out last:border-b-0 hover:bg-[#F2EFE8] focus-within:bg-[#F2EFE8] lg:grid-cols-[132px_1.2fr_124px_108px_124px_138px_120px_92px] lg:items-center lg:gap-3">
      <div className="min-w-0">
        <p
          className="truncate [font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)"
          title={transaction.id}
        >
          {transaction.id}
        </p>
        <p className="whitespace-nowrap [font-family:var(--font-body)] text-xs text-(--color-secondary) lg:hidden">
          {formatTransactionDate(transaction.createdAt)}
        </p>
      </div>

      <div>
        <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
          {transaction.platformOrderId || transaction.customerWalletId || '-'}
        </p>
        <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary) lg:hidden">
          Paid: {formatTransactionMoney(transaction.paidAmount || transaction.amount)}
        </p>
      </div>

      <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
        {toTitleCase(transaction.type)}
      </p>
      <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
        {formatTransactionMoney(transaction.amount)}
      </p>
      <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
        {formatTransactionMoney(transaction.paidAmount || transaction.amount)}
      </p>

      <div>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-xs font-semibold ${getStatusClassName(
            transaction.status,
          )}`}
        >
          {toTitleCase(transaction.status)}
        </span>
      </div>

      <p className="hidden whitespace-nowrap [font-family:var(--font-body)] text-xs text-(--color-secondary) lg:block">
        {formatTransactionDate(transaction.createdAt)}
      </p>

      <div>
        <Button
          variant="ghost"
          className="h-8 border border-(--color-accent)/45 px-2 text-xs"
          onClick={onView}
        >
          View
        </Button>
      </div>
    </article>
  )
}
