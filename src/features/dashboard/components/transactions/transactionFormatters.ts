import { formatWalletMoney } from '../../utils/walletFormatters.ts'
import type {
  TransactionItem,
  TransactionStatus,
} from '../../services/transactionsSchemas.ts'

const RAIL_CURRENCY: Record<string, string> = {
  india: 'INR',
  bangladesh: 'BDT',
  europe: 'EUR',
}

/** Prefer payment rail (India / Bangladesh) over optional API currency field. */
export function getTransactionCurrency(
  transaction: Pick<TransactionItem, 'rail' | 'currency'>,
) {
  const rail = transaction.rail?.trim().toLowerCase()
  if (rail && RAIL_CURRENCY[rail]) {
    return RAIL_CURRENCY[rail]
  }

  const code = transaction.currency?.trim().toUpperCase()
  if (code) {
    return code
  }

  return 'BDT'
}

export function getStatusClassName(status: TransactionStatus) {
  if (status === 'success') {
    return 'bg-[#9FBA9A] text-black'
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-[#E39E9C] text-black'
}

/** Ledger-style pills for dashboard recent transactions table */
export function getLedgerStatusPillClass(status: TransactionStatus) {
  if (status === 'success') return 'dashboard-pill dashboard-pill-succ'
  if (status === 'pending') return 'dashboard-pill dashboard-pill-pend'
  return 'dashboard-pill dashboard-pill-fail'
}

export function toTitleCase(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function getTransactionMethodLabel(
  transaction: Pick<TransactionItem, 'type' | 'railLabel' | 'rail'>,
) {
  const label = transaction.railLabel?.trim()
  if (label) {
    return label
  }
  const rail = transaction.rail?.trim()
  if (rail) {
    return toTitleCase(rail)
  }
  return toTitleCase(transaction.type)
}

export function formatTransactionMoney(amountText: string, currency: string) {
  const code = currency.trim().toUpperCase() || 'BDT'
  return formatWalletMoney(code, amountText)
}

export function formatTransactionDateParts(
  isoDate: string,
  options?: { includeSeconds?: boolean },
) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return { date: isoDate, time: '' }
  }
  return {
    date: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        ...(options?.includeSeconds ? { second: '2-digit' } : {}),
      })
      .replace(/ ([AP]M)$/i, '\u00A0$1'),
  }
}

export function formatTransactionDate(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = date
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/ ([AP]M)$/i, '\u00A0$1')
  return `${dateStr}\u00A0${timeStr}`
}
