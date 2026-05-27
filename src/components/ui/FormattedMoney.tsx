import { getMoneyDisplayParts } from '../../features/dashboard/utils/walletFormatters.ts'

type FormattedMoneyProps = {
  currency: string
  value: string | number
  className?: string
  symbolClassName?: string
  masked?: boolean
}

export function FormattedMoney({
  currency,
  value,
  className = '',
  symbolClassName = '',
  masked = false,
}: FormattedMoneyProps) {
  const { code, symbol, amount } = getMoneyDisplayParts(currency, value)

  const symbolClasses = [
    'currency-symbol',
    code === 'BDT' ? 'currency-symbol--bdt' : '',
    symbolClassName,
  ]
    .filter(Boolean)
    .join(' ')

  if (masked) {
    if (!symbol) {
      return (
        <span className={className}>
          {code} ******
        </span>
      )
    }

    return (
      <span className={className}>
        <span className={symbolClasses} aria-hidden>
          {symbol}
        </span>{' '}
        <span className="currency-amount tabular-nums">******</span>
      </span>
    )
  }

  if (!symbol) {
    return (
      <span className={className}>
        {code} {amount}
      </span>
    )
  }

  return (
    <span className={className}>
      <span className={symbolClasses} aria-hidden>
        {symbol}
      </span>{' '}
      <span className="currency-amount tabular-nums">{amount}</span>
    </span>
  )
}
