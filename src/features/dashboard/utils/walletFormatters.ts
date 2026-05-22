export function formatWalletMoney(currency: string, value: string | number) {
  const n = typeof value === 'string' ? Number(value) : value
  const safe = Number.isFinite(n) ? n : 0
  return `${currency} ${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
