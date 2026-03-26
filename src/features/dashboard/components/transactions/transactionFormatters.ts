import type { TransactionStatus } from '../../services/transactionsSchemas.ts'

export function getStatusClassName(status: TransactionStatus) {
  if (status === 'success') {
    return 'bg-[#9FBA9A] text-black'
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-[#E39E9C] text-black'
}

export function toTitleCase(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function formatTransactionMoney(amountText: string) {
  const amountNumber = Number(amountText)
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0
  return `BDT ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
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
