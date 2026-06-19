const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  INR: '₹',
  USD: '$',
  USDT: '₮',
  USDC: '$',
  EUR: '€',
  GBP: '£',
}

const CURRENCY_FULL_NAMES: Record<string, string> = {
  BDT: 'Bangladeshi Taka',
  INR: 'Indian Rupee',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  SGD: 'Singapore Dollar',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  PKR: 'Pakistani Rupee',
  LKR: 'Sri Lankan Rupee',
  NPR: 'Nepalese Rupee',
  MYR: 'Malaysian Ringgit',
  THB: 'Thai Baht',
  PHP: 'Philippine Peso',
  IDR: 'Indonesian Rupiah',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  HKD: 'Hong Kong Dollar',
}

let displayNames: Intl.DisplayNames | undefined

function intlCurrencyName(code: string): string | undefined {
  try {
    displayNames ??= new Intl.DisplayNames(['en'], { type: 'currency' })
    const name = displayNames.of(code)
    if (name && name !== code) {
      return name
    }
  } catch {
    /* Intl not available or invalid code */
  }
  return undefined
}

/** Currency symbol when defined (e.g. BDT → ৳). */
export function getCurrencySymbol(code: string): string | undefined {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return undefined
  return CURRENCY_SYMBOLS[normalized]
}

/** Settlement list for market cards (e.g. INR, USDT → ₹, $). */
export function formatSettlementCurrenciesLabel(currencies: string[]) {
  return currencies
    .map((code) => {
      const normalized = code.trim().toUpperCase()
      return getCurrencySymbol(normalized) ?? normalized
    })
    .join(', ')
}

/** Icon glyph for a market row — prefers $ for dollar-pegged settlement currencies. */
export function getMarketSettlementIcon(currencies: string[]) {
  const dollarCode = currencies.find((code) => {
    const normalized = code.trim().toUpperCase()
    return normalized === 'USDT' || normalized === 'USDC' || normalized === 'USD'
  })
  if (dollarCode) {
    return getCurrencySymbol(dollarCode) ?? '$'
  }
  const first = currencies[0]?.trim().toUpperCase() ?? ''
  return getCurrencySymbol(first) ?? first.slice(0, 1)
}

/** Full currency name for UI labels (e.g. BDT → Bangladeshi Taka). */
export function getCurrencyFullName(code: string): string {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    return ''
  }
  return (
    CURRENCY_FULL_NAMES[normalized] ??
    intlCurrencyName(normalized) ??
    normalized
  )
}
