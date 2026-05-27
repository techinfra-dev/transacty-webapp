import { getCurrencySymbol } from '../../../utils/currencyNames.ts'

function formatAmountNumber(value: string | number) {
  const n = typeof value === 'string' ? Number(value) : value
  const safe = Number.isFinite(n) ? n : 0
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export type MoneyDisplayParts = {
  code: string
  symbol: string | null
  amount: string
}

export function getMoneyDisplayParts(
  currency: string,
  value: string | number,
): MoneyDisplayParts {
  const code = currency.trim().toUpperCase()
  const amount = formatAmountNumber(value)
  const symbol = getCurrencySymbol(code) ?? null
  return { code, symbol, amount }
}

export function formatWalletMoney(currency: string, value: string | number) {
  const { code, symbol, amount } = getMoneyDisplayParts(currency, value)
  if (symbol) {
    return `${symbol} ${amount}`
  }
  return `${code} ${amount}`
}

export function maskWalletMoney(currency: string) {
  const code = currency.trim().toUpperCase()
  const symbol = getCurrencySymbol(code)
  if (symbol) {
    return `${symbol} ******`
  }
  return `${code} ******`
}

export function parseWalletMoneyDisplay(displayValue: string, currencyCode: string) {
  const code = currencyCode.trim().toUpperCase()
  const symbol = getCurrencySymbol(code)
  const trimmed = displayValue.trim()

  if (symbol && trimmed.startsWith(symbol)) {
    return {
      symbol,
      amount: trimmed.slice(symbol.length).trim(),
      code,
    }
  }

  const trailingCode = trimmed.match(/^([\d,.\s]+)\s+([A-Za-z]{3})$/)
  if (trailingCode) {
    const [, amountPart, codePart] = trailingCode
    const parsedCode = codePart.toUpperCase()
    return {
      symbol: getCurrencySymbol(parsedCode) ?? symbol ?? null,
      amount: amountPart.trim(),
      code: parsedCode,
    }
  }

  const space = trimmed.indexOf(' ')
  if (space === -1) {
    return { symbol: symbol ?? null, amount: trimmed, code }
  }

  const leading = trimmed.slice(0, space)
  const amount = trimmed.slice(space + 1)
  const leadingSymbol = getCurrencySymbol(leading)
  if (leadingSymbol) {
    return { symbol: leadingSymbol, amount, code }
  }

  return { symbol: symbol ?? null, amount, code: code || leading }
}
