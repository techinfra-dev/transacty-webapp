export const CUSTOMER_DETAIL_TAB_IDS = [
  'overview',
  'transactions',
  'activity',
] as const

export type CustomerDetailTabId = (typeof CUSTOMER_DETAIL_TAB_IDS)[number]

export const customerDetailTabs: Array<{
  id: CustomerDetailTabId
  label: string
}> = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'activity', label: 'Activity' },
]

export function isCustomerDetailTabId(value: string): value is CustomerDetailTabId {
  return (CUSTOMER_DETAIL_TAB_IDS as readonly string[]).includes(value)
}

/** Map legacy `?tab=status` links to overview. */
export function normalizeCustomerDetailTab(
  value: string | undefined,
): CustomerDetailTabId | undefined {
  if (!value) {
    return undefined
  }
  if (value === 'status') {
    return 'overview'
  }
  return isCustomerDetailTabId(value) ? value : undefined
}
