import type { TransactionItem } from '../../services/transactionsSchemas.ts'
import { getTransactionMethodLabel } from './transactionFormatters.ts'

type TransactionMethodTagProps = {
  transaction: Pick<TransactionItem, 'type' | 'railLabel' | 'rail'>
  className?: string
}

export function TransactionMethodTag({
  transaction,
  className = '',
}: TransactionMethodTagProps) {
  const label = getTransactionMethodLabel(transaction)
  const classes = ['transaction-method-tag', className].filter(Boolean).join(' ')

  return (
    <span className={classes} title={label}>
      {label}
    </span>
  )
}
