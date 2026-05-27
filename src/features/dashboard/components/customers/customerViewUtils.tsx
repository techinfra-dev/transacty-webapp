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

export function LoadingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
      {label}
    </span>
  )
}
