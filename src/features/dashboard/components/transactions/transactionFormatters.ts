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

/** Prefer API currency; fall back to rail default when currency is omitted. */
export function getTransactionCurrency(
  transaction: Pick<TransactionItem, 'rail' | 'currency'>,
) {
  const code = transaction.currency?.trim().toUpperCase()
  if (code) {
    return code
  }

  const rail = transaction.rail?.trim().toLowerCase()
  if (rail && RAIL_CURRENCY[rail]) {
    return RAIL_CURRENCY[rail]
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
  transaction: Pick<TransactionItem, 'type' | 'railLabel' | 'rail'> & {
    metadata?: Record<string, unknown> | null
  },
) {
  const product = readTyltProduct(transaction.metadata)
  if (product) {
    return TYLT_PRODUCT_LABELS[product] ?? toTitleCase(product)
  }
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

const TYLT_PRODUCT_LABELS: Record<string, string> = {
  h2h_upi: 'India UPI pay-in',
  cpg_payin: 'India CPG pay-in',
  cpg_payout: 'India CPG payout',
  eur_payin: 'Europe pay-in',
  eur_payout: 'Europe payout',
  'tekko-pyusd-payin': 'PYUSD pay-in',
  tekko_pyusd_payin: 'PYUSD pay-in',
}

function readTyltProduct(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return null
  }
  const value = metadata.tyltProduct
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function isIndiaDisputeTransaction(
  transaction: Pick<TransactionItem, 'rail'> & {
    metadata?: Record<string, unknown> | null
  },
) {
  const rail = transaction.rail?.trim().toLowerCase()
  if (rail !== 'india') {
    return false
  }
  const metadata = transaction.metadata
  if (!metadata) {
    return false
  }
  if (metadata.disputeState != null && String(metadata.disputeState).trim()) {
    return true
  }
  const payinSnapshot = metadata.payinSnapshot
  if (payinSnapshot && typeof payinSnapshot === 'object') {
    const tradeEventId = (payinSnapshot as Record<string, unknown>).tradeEventId
    if (tradeEventId === 5 || tradeEventId === '5') {
      return true
    }
  }
  return false
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
