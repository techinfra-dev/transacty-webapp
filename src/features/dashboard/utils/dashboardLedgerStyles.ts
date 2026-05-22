export function splitMoneyDisplay(value: string) {
  const trimmed = value.trim()
  const space = trimmed.indexOf(' ')
  if (space === -1) {
    return { currency: '', amount: trimmed }
  }
  return {
    currency: trimmed.slice(0, space),
    amount: trimmed.slice(space + 1),
  }
}

export function walletStatusPillClass(statusRaw: string) {
  const status = statusRaw.trim().toLowerCase()
  if (status === 'active') return 'dashboard-pill dashboard-pill-succ'
  if (status === 'pending') return 'dashboard-pill dashboard-pill-pend'
  if (
    status === 'failed' ||
    status.includes('reject') ||
    status.includes('error') ||
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'inactive' ||
    status === 'disabled' ||
    status === 'closed' ||
    status === 'suspended' ||
    status === 'blocked' ||
    status === 'frozen'
  ) {
    return 'dashboard-pill dashboard-pill-fail'
  }
  return 'dashboard-pill dashboard-pill-neutral'
}

export function formatWalletStatusLabel(statusRaw: string) {
  const trimmed = statusRaw.trim()
  if (!trimmed) return '—'
  return trimmed.replace(/_/g, ' ')
}
