import type { TransactionItem } from '../../services/transactionsSchemas.ts'
import { getTransactionCurrency } from './transactionFormatters.ts'

const RAIL_LOCAL_CURRENCY: Record<string, string> = {
  india: 'INR',
  bangladesh: 'BDT',
  europe: 'EUR',
}

const STABLECOIN_SETTLEMENT = new Set(['USDT', 'USDC'])

export type TransactionAmountDisplay = {
  localAmount: string | null
  localCurrency: string | null
  settlementAmount: string
  settlementCurrency: string
  isDualCurrency: boolean
  conversionRate: number | null
  payerEmail: string | null
}

type TransactionLike = Pick<
  TransactionItem,
  'amount' | 'paidAmount' | 'rail'
> & {
  currency?: TransactionItem['currency']
} & Record<string, unknown>

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function parseAccountsBlock(tx: Record<string, unknown>) {
  const accounts =
    asRecord(tx.accounts) ?? asRecord(asRecord(tx.metadata)?.accounts)
  if (!accounts) {
    return null
  }

  return {
    localCurrency: readString(accounts.localCurrency)?.toUpperCase() ?? null,
    localAmount: readNumber(accounts.amountPaidInLocalCurrency),
    settlementAmount:
      readNumber(accounts.merchantAccountCredited) ??
      readNumber(accounts.amountPaidInCryptoCurrency),
    settlementCurrency:
      readString(accounts.cryptoCurrencySymbol)?.toUpperCase() ?? null,
    conversionRate: readNumber(accounts.conversionRate),
  }
}

function getPayerEmail(tx: Record<string, unknown>) {
  const user = asRecord(tx.user)
  return readString(user?.email)
}

function inferLocalCurrency(
  rail: string | undefined,
  settlementCurrency: string,
) {
  const normalizedRail = rail?.trim().toLowerCase()
  if (!normalizedRail) {
    return null
  }
  if (
    normalizedRail === 'india' &&
    settlementCurrency === 'USDT'
  ) {
    return 'INR'
  }
  if (
    normalizedRail === 'europe' &&
    settlementCurrency === 'USDC'
  ) {
    return 'EUR'
  }
  return RAIL_LOCAL_CURRENCY[normalizedRail] ?? null
}

function formatAmountValue(value: number | string) {
  if (typeof value === 'number') {
    return String(value)
  }
  return value
}

export function getTransactionAmountDisplay(
  transaction: TransactionLike,
): TransactionAmountDisplay {
  const tx = transaction as Record<string, unknown>
  const accounts = parseAccountsBlock(tx)
  const settlementCurrency =
    readString(tx.settlementCurrency)?.toUpperCase() ??
    accounts?.settlementCurrency ??
    getTransactionCurrency(transaction).toUpperCase()

  let localCurrency = accounts?.localCurrency ?? null
  let localAmount: string | null = null
  let settlementAmount = transaction.paidAmount ?? transaction.amount
  let conversionRate = accounts?.conversionRate ?? null

  if (accounts?.localAmount != null) {
    localAmount = formatAmountValue(accounts.localAmount)
  }
  if (accounts?.settlementAmount != null) {
    settlementAmount = formatAmountValue(accounts.settlementAmount)
  }

  if (
    !localAmount &&
    STABLECOIN_SETTLEMENT.has(settlementCurrency)
  ) {
    localCurrency =
      localCurrency ??
      inferLocalCurrency(transaction.rail, settlementCurrency)

    const amountNum = readNumber(transaction.amount)
    const paidNum = readNumber(transaction.paidAmount)

    if (
      localCurrency &&
      amountNum != null &&
      paidNum != null &&
      amountNum > paidNum * 2
    ) {
      localAmount = transaction.amount
      settlementAmount = transaction.paidAmount ?? transaction.amount
    }
  }

  const isDualCurrency = Boolean(
    localAmount &&
      localCurrency &&
      localCurrency !== settlementCurrency,
  )

  return {
    localAmount: isDualCurrency ? localAmount : null,
    localCurrency: isDualCurrency ? localCurrency : null,
    settlementAmount,
    settlementCurrency,
    isDualCurrency,
    conversionRate,
    payerEmail: getPayerEmail(tx),
  }
}

export function getTransactionHeaderAmountDisplay(
  transaction: TransactionLike,
) {
  const amounts = getTransactionAmountDisplay(transaction)
  if (amounts.isDualCurrency && amounts.localAmount && amounts.localCurrency) {
    return {
      value: amounts.localAmount,
      currency: amounts.localCurrency,
    }
  }
  return {
    value: transaction.amount,
    currency: amounts.settlementCurrency,
  }
}

export function getTransactionAmountColumnDisplay(
  transaction: TransactionLike,
) {
  const amounts = getTransactionAmountDisplay(transaction)
  if (amounts.isDualCurrency && amounts.localAmount && amounts.localCurrency) {
    return {
      value: amounts.localAmount,
      currency: amounts.localCurrency,
    }
  }
  return {
    value: transaction.amount,
    currency: amounts.settlementCurrency,
  }
}

export function getTransactionPaidColumnDisplay(transaction: TransactionLike) {
  const amounts = getTransactionAmountDisplay(transaction)
  return {
    value: amounts.settlementAmount,
    currency: amounts.settlementCurrency,
  }
}
