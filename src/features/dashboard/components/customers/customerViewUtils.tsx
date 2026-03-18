import type { CustomerStatus } from '../../services/customersSchemas.ts'

export const statusFilterOptions = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
]

export const pageSizeOptions = [
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
]

export const statusUpdateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
]

export const txPageSizeOptions = [
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
]

export function getCustomerStatusClassName(status: CustomerStatus) {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  if (status === 'frozen') {
    return 'bg-blue-100 text-blue-700'
  }
  return 'bg-rose-100 text-rose-700'
}

export function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function formatMoney(currency: string, amountText: string) {
  const amountNumber = Number(amountText)
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LoadingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
      {label}
    </span>
  )
}
