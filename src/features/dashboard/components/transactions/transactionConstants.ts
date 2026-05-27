export const transactionMethodOptions = [
  { value: 'all', label: 'All types' },
  { value: 'payin', label: 'Payin' },
  { value: 'payout', label: 'Payout' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'refund', label: 'Refund' },
]

export const transactionStatusOptions = [
  { value: 'all', label: 'All status' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

/** Maximum allowed by `GET me/transactions` query validation. */
export const TRANSACTIONS_LIST_MAX_LIMIT = 100

export const transactionPageSizeOptions = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: String(TRANSACTIONS_LIST_MAX_LIMIT), label: '100' },
]
