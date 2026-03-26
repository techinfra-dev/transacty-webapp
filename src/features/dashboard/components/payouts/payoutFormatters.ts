export function formatPayoutMoney(currency: string, amountText: string) {
  const amountNumber = Number(amountText)
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function currencyOptionLabel(code: string) {
  const names: Record<string, string> = {
    BDT: 'Bangladeshi Taka',
    USD: 'US Dollar',
    EUR: 'Euro',
  }
  return `${code} - ${names[code] ?? code}`
}
