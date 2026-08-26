import type { CustomerStatus } from '../../services/customersSchemas.ts'

export const statusFilterOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
]

export const pageSizeOptions = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
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

export function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function getCustomerInitials(customer: {
  label?: string | null
  id: string
}) {
  const label = customer.label?.trim()
  if (label) {
    const parts = label.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    }
    return label.slice(0, 2).toUpperCase()
  }
  return customer.id.slice(0, 2).toUpperCase()
}

export function getCustomerAvatarClassName(status: CustomerStatus) {
  if (status === 'active') {
    return 'customers-avatar customers-avatar--active'
  }
  if (status === 'pending') {
    return 'customers-avatar customers-avatar--pending'
  }
  if (status === 'frozen') {
    return 'customers-avatar customers-avatar--frozen'
  }
  return 'customers-avatar customers-avatar--closed'
}

export function getCustomerStatusPillClassName(status: CustomerStatus) {
  if (status === 'active') {
    return 'customers-status-pill customers-status-pill--active'
  }
  if (status === 'pending') {
    return 'customers-status-pill customers-status-pill--pending'
  }
  if (status === 'frozen') {
    return 'customers-status-pill customers-status-pill--frozen'
  }
  return 'customers-status-pill customers-status-pill--closed'
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { primary: value, secondary: '' }
  }
  return {
    primary: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    secondary: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

export function formatRelativeTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.round(diffMs / 60_000)
  if (diffMinutes < 1) {
    return 'just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`
  }
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 1) {
    return 'yesterday'
  }
  if (diffDays < 30) {
    return `${diffDays} days ago`
  }
  const diffMonths = Math.round(diffDays / 30)
  if (diffMonths < 12) {
    return `${diffMonths} mo ago`
  }
  return `${Math.round(diffMonths / 12)} yr ago`
}

export function getCustomerWalletTitle(customer: {
  label?: string | null
  id: string
}) {
  const label = customer.label?.trim()
  if (label) {
    return label
  }
  return `Wallet ${customer.id.slice(0, 4)}`
}

export function getCustomerShortId(customerId: string) {
  if (customerId.length <= 12) {
    return customerId
  }
  return `${customerId.slice(0, 8)}…${customerId.slice(-4)}`
}

export function getMarketNameForCurrency(currency: string) {
  const code = currency.trim().toUpperCase()
  if (code === 'BDT') return 'Bangladesh'
  if (code === 'INR') return 'India'
  if (code === 'EUR') return 'Europe'
  if (code === 'BRL') return 'Brazil'
  if (code === 'PYUSD') return 'PYUSD'
  if (code === 'USDT' || code === 'USDC' || code === 'USD') return 'Stablecoin'
  return code
}

export function LoadingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
      {label}
    </span>
  )
}
