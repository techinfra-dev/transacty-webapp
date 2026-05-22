import { useTransactionDetailModalStore } from '../../../../store/transactionDetailModalStore.ts'
import type { TransactionItem } from '../../services/transactionsSchemas.ts'
import {
  formatTransactionDate,
  formatTransactionMoney,
  getStatusClassName,
  toTitleCase,
} from './transactionFormatters.ts'

type TransactionRowProps = {
  transaction: TransactionItem
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )

  return (
    <article
      role="button"
      tabIndex={0}
      className="grid cursor-pointer gap-2 border-b border-(--color-accent)/25 bg-(--color-card) px-5 py-2 transition-colors duration-150 ease-out last:border-b-0 hover:bg-[#F2EFE8] focus-visible:bg-[#F2EFE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0700]/20 lg:grid-cols-[132px_1.2fr_124px_108px_124px_138px_120px] lg:items-center lg:gap-3"
      onClick={() => openTransactionDetail(transaction.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openTransactionDetail(transaction.id)
        }
      }}
    >
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
    </article>
  )
}
