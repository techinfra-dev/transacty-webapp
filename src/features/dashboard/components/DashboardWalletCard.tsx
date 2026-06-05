import { Link } from '@tanstack/react-router'
import { getCurrencyFullName, getCurrencySymbol } from '../../../utils/currencyNames.ts'
import { getMarketDisplayName } from '../utils/marketDisplayUtils.ts'
import {
  formatWalletMoney,
  maskWalletMoney,
} from '../utils/walletFormatters.ts'
import {
  formatWalletStatusLabel,
  walletStatusPillClass,
} from '../utils/dashboardLedgerStyles.ts'

interface DashboardWalletCardProps {
  walletId: string
  currency: string
  amount: number
  areBalancesHidden?: boolean
  statusLabel: string
  market?: string | null
  displayLabel?: string | null
  isSelected?: boolean
}

function formatAmountOnly(value: number) {
  const safe = Number.isFinite(value) ? value : 0
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function DashboardWalletCard({
  walletId,
  currency,
  amount,
  areBalancesHidden = false,
  statusLabel,
  market,
  displayLabel,
  isSelected = false,
}: DashboardWalletCardProps) {
  const code = currency.trim().toUpperCase()
  const normalizedMarket = (market ?? '').trim().toLowerCase()
  const isEuropeMarket = normalizedMarket === 'europe'
  const symbol = getCurrencySymbol(code)
  const currencyName = getCurrencyFullName(code)
  const walletTitle =
    displayLabel?.trim() ||
    (isEuropeMarket ? `${getMarketDisplayName('europe')} (${code})` : currencyName)
  const badgeLabel = isEuropeMarket ? getMarketDisplayName('europe') : code
  const footerNote = isEuropeMarket ? 'Europe merchant pocket' : 'Merchant pocket'
  const statusDisplay = formatWalletStatusLabel(statusLabel)
  const amountDisplay = areBalancesHidden
    ? '******'
    : formatAmountOnly(amount)
  const ariaLabel = areBalancesHidden
    ? maskWalletMoney(code)
    : formatWalletMoney(code, amount)

  return (
    <Link
      to="/dashboard/wallets/$walletId"
      params={{ walletId }}
      className={`dashboard-wallet ${isEuropeMarket ? 'dashboard-wallet--europe' : ''} ${isSelected ? 'dashboard-wallet--selected' : ''}`}
      aria-current={isSelected ? 'page' : undefined}
      aria-label={`${walletTitle}, ${ariaLabel}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`dashboard-wallet-code shrink-0 ${isEuropeMarket ? 'dashboard-wallet-code--europe' : ''}`}
        >
          {badgeLabel}
        </span>
        <span className="dashboard-wallet-name truncate">{walletTitle}</span>
      </div>

      <div className="flex min-w-0 items-baseline gap-1.5">
        {symbol ? (
          <span
            className={`dashboard-wallet-currency-symbol shrink-0 ${code === 'BDT' ? 'dashboard-wallet-currency-symbol--bdt' : ''}`}
            aria-hidden
          >
            {symbol}
          </span>
        ) : null}
        <span className="dashboard-wallet-balance truncate">{amountDisplay}</span>
        {code ? <span className="dashboard-wallet-code-inline">{code}</span> : null}
      </div>

      <div className="dashboard-wallet-footer">
        <span className={walletStatusPillClass(statusLabel)}>
          <i aria-hidden />
          <span className="capitalize">{statusDisplay}</span>
        </span>
        <span className="dashboard-wallet-footer-note">{footerNote}</span>
      </div>
    </Link>
  )
}
