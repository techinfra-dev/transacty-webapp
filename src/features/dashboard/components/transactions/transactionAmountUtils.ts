import type { TransactionItem, TransactionFeeStatus } from '../../services/transactionsSchemas.ts'
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
  payerName: string | null
  payerEmail: string | null
}

type TransactionLike = Pick<
  TransactionItem,
  'amount' | 'paidAmount' | 'rail' | 'status'
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

function getPaymentDetailsBlock(tx: Record<string, unknown>) {
  const metadata = asRecord(tx.metadata)
  const payinSnapshot = asRecord(metadata?.payinSnapshot)
  return asRecord(payinSnapshot?.paymentDetails)
}

function parseAccountsBlock(tx: Record<string, unknown>) {
  const paymentDetails = getPaymentDetailsBlock(tx)
  const accounts =
    asRecord(tx.accounts) ??
    asRecord(asRecord(tx.metadata)?.accounts) ??
    asRecord(paymentDetails?.accounts)
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

function parseUpiPayerName(qrString: string | null) {
  if (!qrString) {
    return null
  }

  try {
    const payerName = new URL(qrString).searchParams.get('pn')
    if (payerName) {
      return decodeURIComponent(payerName.replace(/\+/g, ' ')).trim()
    }
  } catch {
    const match = qrString.match(/[?&]pn=([^&]+)/i)
    if (match) {
      try {
        return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim()
      } catch {
        return match[1].trim()
      }
    }
  }

  return null
}

function getPayerEmail(tx: Record<string, unknown>) {
  const topLevelUser = asRecord(tx.user)
  const fromTopLevel = readString(topLevelUser?.email)
  if (fromTopLevel) {
    return fromTopLevel
  }

  const paymentDetails = getPaymentDetailsBlock(tx)
  const nestedUser = asRecord(paymentDetails?.user)
  return readString(nestedUser?.email)
}

function getPayerName(tx: Record<string, unknown>) {
  const paymentDetails = getPaymentDetailsBlock(tx)
  const trade = asRecord(paymentDetails?.trade)
  const paymentMethod = asRecord(trade?.paymentMethod)
  const details = asRecord(paymentMethod?.details)

  const fromField = readString(details?.pn)
  if (fromField) {
    return fromField
  }

  return parseUpiPayerName(readString(details?.qrString))
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

function parseConversionRate(
  tx: Record<string, unknown>,
  accounts: ReturnType<typeof parseAccountsBlock>,
) {
  if (accounts?.conversionRate != null) {
    return accounts.conversionRate
  }

  const metadata = asRecord(tx.metadata)
  const payinSnapshot = asRecord(metadata?.payinSnapshot)
  const paymentDetails = asRecord(payinSnapshot?.paymentDetails)
  const nestedAccounts =
    asRecord(paymentDetails?.accounts) ?? asRecord(metadata?.accounts)

  return readNumber(nestedAccounts?.conversionRate) ?? readNumber(metadata?.conversionRate)
}

function isIndiaUsdtTransaction(
  rail: string | undefined,
  settlementCurrency: string,
) {
  return (
    rail?.trim().toLowerCase() === 'india' && settlementCurrency === 'USDT'
  )
}

function resolveIndiaUsdtAmounts(params: {
  transaction: TransactionLike
  amountNum: number | null
  paidNum: number | null
  conversionRate: number | null
  accounts: ReturnType<typeof parseAccountsBlock>
  localAmount: string | null
  settlementAmount: string
}) {
  const {
    transaction,
    amountNum,
    paidNum,
    conversionRate,
    accounts,
    localAmount,
    settlementAmount,
  } = params

  if (localAmount) {
    return {
      localAmount,
      localCurrency: 'INR' as const,
      settlementAmount,
      conversionRate,
    }
  }

  if (amountNum != null && paidNum != null && amountNum > paidNum * 2) {
    return {
      localAmount: transaction.amount,
      localCurrency: 'INR' as const,
      settlementAmount: formatAmountValue(paidNum),
      conversionRate,
    }
  }

  const settlementNum =
    accounts?.settlementAmount ?? paidNum ?? null

  if (conversionRate && settlementNum != null) {
    return {
      localAmount: formatAmountValue(settlementNum * conversionRate),
      localCurrency: 'INR' as const,
      settlementAmount: formatAmountValue(settlementNum),
      conversionRate,
    }
  }

  if (conversionRate && amountNum != null && paidNum == null) {
    const usdtFromInr = amountNum / conversionRate
    const inrFromUsdt = amountNum * conversionRate

    if (usdtFromInr < 1000 && amountNum >= 100) {
      return {
        localAmount: transaction.amount,
        localCurrency: 'INR' as const,
        settlementAmount: formatAmountValue(usdtFromInr),
        conversionRate,
      }
    }

    if (amountNum < 100 && inrFromUsdt >= amountNum * 5) {
      return {
        localAmount: formatAmountValue(inrFromUsdt),
        localCurrency: 'INR' as const,
        settlementAmount: formatAmountValue(amountNum),
        conversionRate,
      }
    }

    return {
      localAmount: transaction.amount,
      localCurrency: 'INR' as const,
      settlementAmount: formatAmountValue(usdtFromInr),
      conversionRate,
    }
  }

  if (amountNum != null) {
    return {
      localAmount: transaction.amount,
      localCurrency: 'INR' as const,
      settlementAmount: paidNum != null ? formatAmountValue(paidNum) : settlementAmount,
      conversionRate,
    }
  }

  return null
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
  let conversionRate = parseConversionRate(tx, accounts)

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

  if (isIndiaUsdtTransaction(transaction.rail, settlementCurrency)) {
    const amountNum = readNumber(transaction.amount)
    const paidNum = readNumber(transaction.paidAmount)
    const indiaAmounts = resolveIndiaUsdtAmounts({
      transaction,
      amountNum,
      paidNum,
      conversionRate,
      accounts,
      localAmount,
      settlementAmount,
    })

    if (indiaAmounts) {
      localAmount = indiaAmounts.localAmount
      localCurrency = indiaAmounts.localCurrency
      settlementAmount = indiaAmounts.settlementAmount
      conversionRate = indiaAmounts.conversionRate
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
    payerName: getPayerName(tx),
    payerEmail: getPayerEmail(tx),
  }
}

export function getTransactionWalletPocketCurrency(
  transaction: TransactionLike,
): string {
  const amounts = getTransactionAmountDisplay(transaction)

  if (amounts.isDualCurrency) {
    return amounts.settlementCurrency
  }

  const explicitCurrency = readString(transaction.currency)?.toUpperCase()
  if (explicitCurrency) {
    return explicitCurrency
  }

  return amounts.settlementCurrency
}

export function transactionMatchesCurrency(
  transaction: TransactionLike,
  walletCurrency: string,
) {
  const target = walletCurrency.trim().toUpperCase()
  if (!target) {
    return true
  }
  return getTransactionWalletPocketCurrency(transaction).toUpperCase() === target
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
  if (amounts.localAmount && amounts.localCurrency) {
    return {
      value: amounts.localAmount,
      currency: amounts.localCurrency,
    }
  }

  if (isIndiaUsdtTransaction(transaction.rail, amounts.settlementCurrency)) {
    return {
      value: transaction.amount,
      currency: 'INR',
    }
  }

  return {
    value: transaction.amount,
    currency: amounts.settlementCurrency,
  }
}

export function getTransactionPaidColumnDisplay(transaction: TransactionLike) {
  const currency = getTransactionCurrency(transaction as TransactionItem)

  if (transaction.status === 'pending') {
    return {
      hasValue: false,
      value: null,
      currency,
    }
  }

  const amounts = getTransactionAmountDisplay(transaction)
  return {
    hasValue: true,
    value: amounts.settlementAmount,
    currency: amounts.settlementCurrency,
  }
}

function readFeeAmount(value: string | undefined) {
  if (!value?.trim()) {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function getTransactionFeeColumnDisplay(
  transaction: Pick<TransactionItem, 'fees' | 'currency' | 'rail'>,
) {
  const currency = getTransactionCurrency(transaction)
  const platformFee = transaction.fees?.platformFee
  const feeAmount = readFeeAmount(platformFee)
  const hasFee = feeAmount != null && feeAmount > 0

  return {
    hasFee,
    value: hasFee ? platformFee! : null,
    currency,
    feeStatus: transaction.fees?.feeStatus,
    feeType: transaction.fees?.feeType,
  }
}

export function formatTransactionFeeStatusLabel(status?: TransactionFeeStatus) {
  if (!status || status === 'none') {
    return 'None'
  }
  return status.charAt(0).toUpperCase() + status.slice(1)
}
